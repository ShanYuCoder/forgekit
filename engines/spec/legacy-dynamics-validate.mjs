#!/usr/bin/env node
/**
 * Validate _legacy.dynamics.yaml (pointer-only archaeology).
 * Usage: pnpm legacy-dynamics:validate -- product/legacy-dynamics/{module}/_legacy.dynamics.yaml
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

const REQUIRED_TOP = ['schema', 'module', 'legacy', 'tracedAt', 'index', 'slices']
const SCHEMA = 'portal-legacy-dynamics/v1'

function validateDynamics(doc, filePath) {
  const errors = []
  const rel = path.relative(process.cwd(), filePath)

  if (doc.schema !== SCHEMA) {
    errors.push(`${rel}: schema must be ${SCHEMA}`)
  }
  for (const key of REQUIRED_TOP) {
    if (doc[key] == null) errors.push(`${rel}: missing ${key}`)
  }
  if (!doc.legacy?.repo) errors.push(`${rel}: legacy.repo required`)

  const index = doc.index ?? {}
  const slices = doc.slices ?? {}
  for (const [fnId, entry] of Object.entries(index)) {
    const sliceKey = entry?.slice?.replace(/^slices\./, '')
    if (!sliceKey || !slices[sliceKey]) {
      errors.push(`${rel}: index.${fnId} slice ${entry?.slice} not in slices`)
    }
  }

  for (const [refId, ref] of Object.entries(doc.refs ?? {})) {
    if (!refId.startsWith('legacy://')) errors.push(`${rel}: ref key must be legacy:// — got ${refId}`)
    if (!ref?.file) errors.push(`${rel}: refs.${refId} missing file pointer`)
  }

  return errors
}

async function main() {
  const paths = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  if (!paths.length) {
    console.error('Usage: pnpm legacy-dynamics:validate -- <_legacy.dynamics.yaml> [more...]')
    process.exit(1)
  }

  let allErrors = []
  for (const p of paths) {
    const absolute = path.resolve(p)
    const doc = parse(await readFile(absolute, 'utf8')) ?? {}
    allErrors.push(...validateDynamics(doc, absolute))
  }

  if (allErrors.length) {
    for (const e of allErrors) console.error(`legacy-dynamics:validate: ${e}`)
    process.exit(1)
  }

  console.log(`legacy-dynamics:validate: OK (${paths.length} file(s))`)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
