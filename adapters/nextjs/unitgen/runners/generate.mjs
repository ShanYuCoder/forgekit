#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readdir, stat } from 'node:fs/promises'

import { readSpecFile, requireDesignIrPath } from '../../codegen/runners/lib/read-spec.mjs'
import { buildUnitContext, buildUnitFilePlan, collectPlannedPatternTags } from './lib/plan.mjs'
import { readCodegenManifest } from './lib/read-codegen.mjs'
import { renderTemplate } from './lib/render.mjs'
import { loadUnitTestRegistry, REGISTRY_REL } from './lib/unit-registry.mjs'
import {
  renderUnitHandoffMarkdown,
  writeOutputs,
  writeUnitMeta
} from './lib/write-files.mjs'
import { writeSpecTags } from './lib/write-spec-tags.mjs'
import { resolveHubId, resolveProjectRoot } from '../../codegen/runners/lib/resolve-hub-id.mjs'

const root = path.resolve(process.env.CODEGENKIT_ROOT || process.cwd())

function parseArgs(argv) {
  const options = { dryRun: false, force: false, spec: null, id: null, phase: 'prototype', writeSpecTags: false }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run' || arg === '--dry') options.dryRun = true
    else if (arg === '--force') options.force = true
    else if (arg === '--write-spec-tags') options.writeSpecTags = true
    else if (arg === '--phase') options.phase = argv[++i] ?? 'prototype'
    else if (arg === '--spec') options.spec = argv[++i]
    else if (arg === '--id') options.id = argv[++i]
    else if (!arg.startsWith('-') && !options.spec && !options.id) options.spec = arg
  }

  if (!options.spec && !options.id) {
    throw new Error(
      'Usage: codegenkit unit-gen --id W-AD-AUTH-001 [--dry-run] [--force] [--phase prototype|wire]\n' +
        '       codegenkit unit-gen --spec <path-to-ir/design.yaml> …',
    )
  }

  return options
}

/** @param {{ tag: string, reason: string }[]} items */
function dedupeNeedsUnit(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (seen.has(item.tag)) return false
    seen.add(item.tag)
    return true
  })
}

async function listIrSpecFiles(dir) {
  const files = []
  let entries = []
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listIrSpecFiles(entryPath)))
      continue
    }
    if (entry.isFile() && entry.name === 'design.yaml' && entryPath.includes(`${path.sep}code${path.sep}`) && entryPath.includes(`${path.sep}ir${path.sep}`)) {
      files.push(entryPath)
    }
  }

  return files.sort()
}

async function resolveSpecPaths(options) {
  if (options.id) {
    const resolved = resolveHubId(root, options.id, 'codegen')
    for (const n of resolved.notes) console.warn(`  note: ${n}`)
    if (!resolved.paths.length) {
      throw new Error(`--id ${options.id}: no ir/design.yaml under docs hub`)
    }
    console.log(`portal-unit-gen: --id ${options.id} → ${resolved.paths.length} spec(s) (${resolved.kind})`)
    return resolved.paths
  }
  if (options.spec) {
    const specStat = await stat(path.resolve(options.spec)).catch(() => null)
    if (specStat?.isDirectory()) {
      const discovered = await listIrSpecFiles(path.resolve(options.spec))
      if (!discovered.length) {
        throw new Error(`--spec ${options.spec}: directory has no ir/design.yaml files`)
      }
      return discovered
    }
    return [requireDesignIrPath(path.resolve(options.spec))]
  }
  return []
}

async function generateOneUnit(specPath, registry, options) {
  const { spec, specFile, featureDir } = await readSpecFile(specPath)
  const { manifest: codegenManifest } = await readCodegenManifest(featureDir)

  const ctx = buildUnitContext(spec, specFile, codegenManifest, { phase: options.phase })
  const { files, needsUnit, skippedPatterns } = await buildUnitFilePlan(ctx, registry, root)
  const plannedTags = collectPlannedPatternTags(ctx, registry)

  const allNeedsUnit = dedupeNeedsUnit([...needsUnit, ...plannedTags])

  const outputs = []
  for (const file of files) {
    const templateContext = {
      ...ctx,
      validRowJson: JSON.stringify(ctx.validRow, null, 2),
      validFormValuesJson: JSON.stringify(ctx.validFormValues ?? {}, null, 2)
    }
    const content = await renderTemplate(file.template, templateContext)
    outputs.push({ layer: file.layer, relativePath: file.relativePath, content, patternId: file.patternId })
  }

  const { written, skipped } = await writeOutputs(root, outputs, {
    dryRun: options.dryRun,
    force: options.force
  })

  const unitManifest = {
    generatedAt: new Date().toISOString(),
    specFile,
    phase: ctx.phase,
    profile: ctx.profile,
    entity: ctx.entity,
    module: ctx.module,
    codegenManifest: 'generated/codegen.manifest.json',
    unitRegistry: REGISTRY_REL,
    files: files.map((f) => ({
      layer: f.layer,
      path: f.relativePath,
      pattern: f.patternId,
      reqIds: f.reqIds
    })),
    written: written.map((w) => w.relativePath),
    skipped: skipped.map((s) => ({ path: s.relativePath, reason: s.reason })),
    skippedPatterns,
    needsUnit: allNeedsUnit
  }

  const handoff = renderUnitHandoffMarkdown(ctx, written, skipped, allNeedsUnit)
  const meta = await writeUnitMeta(featureDir, unitManifest, handoff, { dryRun: options.dryRun })

  if (options.writeSpecTags && !options.dryRun) {
    const specAbsolute = path.resolve(root, specFile)
    const tagResult = await writeSpecTags(specAbsolute, allNeedsUnit)
    if (tagResult.changed) {
      for (const tag of tagResult.added) {
        console.log(`  spec-tag: ${tag}`)
      }
    }
  }

  console.log(`portal-unit-gen: profile=${ctx.profile} entity=${ctx.entity} phase=${ctx.phase}`)
  console.log(`  spec: ${specFile}`)
  if (options.dryRun) console.log('  mode: dry-run')

  for (const w of written) {
    console.log(`  ${options.dryRun ? '[dry]' : 'write'}: ${w.relativePath}`)
  }
  for (const s of skipped) {
    console.log(`  skip: ${s.relativePath} (${s.reason})`)
  }
  for (const item of allNeedsUnit) {
    console.log(`  needs-unit: ${item.tag}`)
  }
  if (!options.dryRun && meta.manifestPath) {
    console.log(`  manifest: ${path.relative(root, meta.manifestPath)}`)
    console.log(`  handoff: ${path.relative(root, meta.handoffPath)}`)
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const specPaths = await resolveSpecPaths(options)
  const { registry } = await loadUnitTestRegistry(root)
  let failed = 0
  for (const specPath of specPaths) {
    try {
      await generateOneUnit(specPath, registry, options)
      if (specPaths.length > 1) console.log('')
    } catch (e) {
      failed++
      console.error(`portal-unit-gen: FAIL ${path.relative(root, specPath)}: ${e.message ?? e}`)
    }
  }
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
