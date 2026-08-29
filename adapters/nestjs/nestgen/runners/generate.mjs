import path from 'node:path'

import { buildEnrichedPlan, enrichSpecCodegen } from './lib/plan.mjs'
import { parseArgs, readSpecFile } from './lib/read-spec.mjs'
import { writeManifest, writeOutputs } from './lib/write-files.mjs'

const repoRoot = path.resolve(process.env.CODEGENKIT_ROOT ?? process.cwd())

import { resolveHubId, resolveBackendSpecPaths } from '../../../shared/resolve-hub-id.mjs'
import { mergeI18nFlat } from '../../../shared/i18n-merge.mjs'

async function resolveSpecPaths(options) {
  if (options.id) {
    const resolved = resolveHubId(repoRoot, options.id, 'api-codegen')
    for (const n of resolved.notes) console.warn(`  note: ${n}`)
    if (!resolved.paths.length) {
      throw new Error(`--id ${options.id}: no 01-backend-spec.yaml under docs hub`)
    }
    console.log(`nest-gen: --id ${options.id} → ${resolved.paths.length} spec(s) (${resolved.kind})`)
    return resolved.paths
  }
  if (options.spec) {
    return resolveBackendSpecPaths(options.spec)
  }
  throw new Error('No --spec or --id provided.')
}

async function generateOne(options, specPath) {
  const { spec, specFile, featureDir } = await readSpecFile(specPath)

  if (options.writeSpec) {
    enrichSpecCodegen(spec, { repoRoot, force: options.force })
    const yaml = (await import('yaml')).default
    const fs = await import('node:fs/promises')
    await fs.writeFile(specFile, yaml.stringify(spec), 'utf8')
  }

  const plan = await buildEnrichedPlan(spec, { repoRoot, force: options.force })

  console.log(`nest-gen: module=${plan.ctx.module} entity=${plan.ctx.entity} orm=${plan.ctx.orm}`)
  console.log(`  spec: ${path.relative(repoRoot, specFile)}`)
  if (options.dryRun) console.log('  mode: dry-run')
  if (options.force) console.log('  mode: force')

  const { written, skipped } = await writeOutputs(repoRoot, plan, options)
  const meta = await writeManifest(featureDir, plan, specFile, options, written)

  for (const w of written) {
    console.log(`  ${options.dryRun ? '[dry]' : 'write'}: ${w}`)
  }
  for (const s of skipped) {
    console.log(`  skip: ${s.relativePath} (${s.reason})`)
  }

  if (!options.dryRun) {
    console.log(`  manifest: ${path.relative(repoRoot, meta.manifestPath)}`)
  }

  if (spec.i18n) {
    const localesDir = path.join(repoRoot, 'src', 'i18n')
    const i18nFiles = mergeI18nFlat(spec.i18n, localesDir, options.dryRun)
    for (const f of i18nFiles) {
      console.log(`  ${options.dryRun ? '[dry] ' : 'write'}: ${path.relative(repoRoot, f.path)} (+${f.keysAdded} keys)`)
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const specPaths = await resolveSpecPaths(options)

  if (specPaths.length > 1) {
    console.log(`nest-gen: ${specPaths.length} spec(s) to process`)
  }

  for (const specPath of specPaths) {
    await generateOne(options, specPath)
    if (specPaths.length > 1) console.log('')
  }

  process.exit(0)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
