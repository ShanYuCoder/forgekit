import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { parse, stringify } from 'yaml'
import { spawnSync } from 'node:child_process'

const projectRoot = process.cwd()
const docsDir = path.join(projectRoot, 'docs')
const surfacesDir = path.join(projectRoot, 'product', 'surfaces')
const featuresDir = path.join(docsDir, 'features')
const baseFile = path.join(docsDir, 'openapi', 'base.yaml')
const outputFile = path.join(docsDir, 'openapi', 'api.yaml')

async function main() {
  const started = Date.now()
  const base = fsExists(baseFile) ? await readYaml(baseFile) : { openapi: '3.0.3', info: { title: 'Backend API Specifications', version: '1.0.0' } }
  const featureFiles = await listFeatureOpenApiFiles(surfacesDir)
  if (!featureFiles.length) {
    featureFiles.push(...(await listFeatureOpenApiFiles(featuresDir)))
  }

  const merged = structuredClone(base)
  merged.paths ??= {}
  merged.components ??= {}
  merged.components.schemas ??= {}
  merged.components.securitySchemes ??= {}
  merged.tags ??= []

  const mergedFrom = []

  for (const file of featureFiles) {
    const fragment = await readYaml(file)
    const rel = path.relative(projectRoot, file)
    mergeOpenApi(merged, fragment, rel)
    mergedFrom.push(rel)
  }

  merged.info ??= {}
  merged.info.description = [
    base.info?.description?.trim(),
    '',
    'Feature fragments merged by `pnpm openapi:render`:',
    ...mergedFrom.map((f) => `- ${f}`)
  ]
    .filter(Boolean)
    .join('\n')

  await writeFile(outputFile, stringify(merged), 'utf8')

  const lintEnabled = process.env.OPENAPI_LINT === '1' || process.env.OPENAPI_LINT === 'true'
  if (lintEnabled) {
    const lintResults = [outputFile, ...featureFiles].map((file) => lintFile(file))
    const failed = lintResults.filter((r) => r.status !== 0 && r.status != null)

    if (failed.length > 0) {
      for (const result of failed) {
        if (result.stdout) process.stdout.write(result.stdout)
        if (result.stderr) process.stderr.write(result.stderr)
      }
      process.exit(1)
    }
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  console.log(
    `openapi:render: merged ${featureFiles.length} feature file(s) → docs/openapi/api.yaml [${elapsed}s]`
  )
}

/**
 * @param {Record<string, unknown>} target
 * @param {Record<string, unknown>} fragment
 * @param {string} source
 */
function mergeOpenApi(target, fragment, source) {
  for (const [route, item] of Object.entries(fragment.paths ?? {})) {
    if (target.paths[route]) {
      throw new Error(`Duplicate path ${route} when merging ${source}. Check if this API is already defined in common or another module!`)
    }
    target.paths[route] = item
  }

  for (const [name, schema] of Object.entries(fragment.components?.schemas ?? {})) {
    if (target.components.schemas[name]) {
      throw new Error(`Duplicate schema ${name} when merging ${source}`)
    }
    target.components.schemas[name] = schema
  }

  for (const [name, scheme] of Object.entries(fragment.components?.securitySchemes ?? {})) {
    if (target.components.securitySchemes[name]) {
      throw new Error(`Duplicate securityScheme ${name} when merging ${source}`)
    }
    target.components.securitySchemes[name] = scheme
  }

  const existingTags = new Set((target.tags ?? []).map((t) => t.name))
  for (const tag of fragment.tags ?? []) {
    if (!existingTags.has(tag.name)) {
      target.tags.push(tag)
      existingTags.add(tag.name)
    }
  }
}

function lintFile(file) {
  const rel = path.relative(projectRoot, file)
  return spawnSync('pnpm', ['exec', 'redocly', 'lint', rel], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, REDOCLY_TELEMETRY: 'off' },
    timeout: 60_000,
  })
}

function fsExists(file) {
  try {
    return existsSync(file)
  } catch {
    return false
  }
}

async function readYaml(file) {
  return parse(await readFile(file, 'utf8')) ?? {}
}

async function listFeatureOpenApiFiles(dir) {
  const files = []
  for (const entry of await listEntries(dir)) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) continue
      files.push(...(await listFeatureOpenApiFiles(entryPath)))
      continue
    }
    if (entry.isFile() && entry.name === '02-openapi.yaml') {
      files.push(entryPath)
    }
  }
  return files.sort()
}

async function listEntries(dir) {
  try {
    return await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
