#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import path from 'node:path'

import { buildContractPlan } from './lib/plan.mjs'
import { parseArgs, readSpecFile } from './lib/naming.mjs'
import { writeManifest, writeOutputs } from './lib/write-files.mjs'
import { requireDesignIrPath } from '../../../shared/read-fe-ir.mjs'

const root = path.resolve(process.env.CODEGENKIT_ROOT ?? process.cwd())

/**
 * Prefer explicit --yaml-root, then CODEGENKIT_DOCS_ROOT (+ optional /product),
 * then product-local docs/features/yaml under CODEGENKIT_ROOT.
 */
function resolveIrGlobRoots(options) {
  const roots = []
  if (options.yamlRoot) {
    roots.push(path.resolve(options.yamlRoot))
  }
  const docsRoot = process.env.CODEGENKIT_DOCS_ROOT || process.env.DOCSKIT_ROOT
  if (docsRoot) {
    const abs = path.resolve(docsRoot)
    roots.push(path.join(abs, 'product', 'surfaces'))
    roots.push(abs)
  }
  return [...new Set(roots)]
}

async function listIrDesignFiles(dir) {
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
      files.push(...(await listIrDesignFiles(entryPath)))
      continue
    }
    if (entry.isFile() && entry.name === 'design.yaml' && entryPath.includes(`${path.sep}ir${path.sep}`)) {
      files.push(entryPath)
    }
  }

  return files.sort()
}

async function resolveSpecPaths(options) {
  if (options.spec) return [requireDesignIrPath(options.spec)]
  for (const candidate of resolveIrGlobRoots(options)) {
    if (!existsSync(candidate)) continue
    const discovered = await listIrDesignFiles(candidate)
    if (discovered.length > 0) return discovered
  }
  throw new Error(
    'No ir/design.yaml found — pass --spec <ir/design.yaml>, --yaml-root, or set CODEGENKIT_DOCS_ROOT',
  )
}

async function runForSpec(specPath, options) {
  const spec = await readSpecFile(specPath)
  const plan = buildContractPlan(spec, specPath)

  if (plan.files.length === 0) {
    console.warn(`[contract-gen] skip (no entities/fields): ${specPath}`)
    return { written: [], skipped: [] }
  }

  const { written, skipped } = await writeOutputs(root, plan, options)
  const manifest = await writeManifest(root, plan, specPath, { ...options, written, skipped })

  console.log(`[contract-gen] ${options.dryRun ? 'dry' : 'write'} ${specPath}`)
  console.log(`  files: ${written.length} written, ${skipped.length} skipped`)

  return manifest
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const specs = await resolveSpecPaths(options)

  if (specs.length > 1) {
    console.log(`contract-gen: ${specs.length} ir/design.yaml file(s)`)
  }

  let failed = 0
  for (const specPath of specs) {
    try {
      await runForSpec(specPath, options)
      if (specs.length > 1) console.log('')
    } catch (e) {
      failed++
      console.error(`contract-gen: FAIL ${path.relative(root, specPath)}: ${e.message ?? e}`)
    }
  }
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
