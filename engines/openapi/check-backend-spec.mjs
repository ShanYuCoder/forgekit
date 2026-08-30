#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

import { listBackendSpecs } from './gen-openapi.mjs'
import { checkBackendSpec } from './lib/check-backend-spec.mjs'

async function resolveSpecFiles(specArg, cwd) {
  if (!specArg) {
    const surfaces = path.join(cwd, 'product', 'surfaces')
    return await listBackendSpecs(surfaces)
  }
  const abs = path.resolve(cwd, specArg)
  const st = existsSync(abs) ? await stat(abs) : null
  if (!st) throw new Error(`Not found: ${abs}`)
  if (st.isDirectory()) return await listBackendSpecs(abs)
  if (path.basename(abs) !== '01-backend-spec.yaml') {
    throw new Error(`Expected 01-backend-spec.yaml, got ${abs}`)
  }
  return [abs]
}

export async function checkBackendSpecFiles(options, cwd = process.cwd()) {
  const files = await resolveSpecFiles(options.spec, cwd)
  if (!files.length) throw new Error('No 01-backend-spec.yaml found. Pass --spec <path>.')
  let failed = 0
  for (const specPath of files) {
    const spec = parse(await readFile(specPath, 'utf8')) ?? {}
    const result = checkBackendSpec(spec, specPath)
    const rel = path.relative(cwd, specPath)
    if (result.ok) {
      console.log(`ok: ${rel}`)
    } else {
      failed++
      console.error(`fail: ${rel}`)
      for (const e of result.errors) console.error(`  ✗ ${e}`)
    }
    for (const w of result.warnings) console.warn(`  warn: ${w}`)
  }
  if (failed) throw new Error(`api:check failed for ${failed} spec(s)`)
  return files
}

function parseArgs(argv) {
  const options = { spec: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--spec') options.spec = argv[++i]
    else if (!arg.startsWith('-') && !options.spec) options.spec = arg
  }
  return options
}

async function main() {
  await checkBackendSpecFiles(parseArgs(process.argv.slice(2)), process.cwd())
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message ?? error)
    process.exit(1)
  })
}
