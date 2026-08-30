#!/usr/bin/env node
import path from 'node:path'
import { mergeBundleFile } from './lib/bundle-ir.mjs'

async function main() {
  const paths = process.argv.slice(2).filter((a) => !a.startsWith('-'))

  if (!paths.length) {
    console.error('Usage: pnpm spec:merge -- <bundle.yaml> [more...]')
    process.exit(1)
  }

  let failed = 0
  for (const p of paths) {
    try {
      await mergeBundleFile(path.resolve(p))
      console.log(`spec:merge: ${p}`)
    } catch (error) {
      failed++
      console.error(`spec:merge: FAIL ${p}: ${error.message ?? error}`)
    }
  }

  process.exit(failed > 0 ? 1 : 0)
}

main()
