#!/usr/bin/env node
import path from 'node:path'
import { checkSplitBundle, splitBundleFile } from './lib/bundle-ir.mjs'
import { writeBundleMarkdownFile } from '../docs/lib/render-bundle-markdown.mjs'

async function main() {
  const args = process.argv.slice(2)
  const check = args.includes('--check')
  const paths = args.filter((a) => !a.startsWith('-'))

  if (!paths.length) {
    console.error('Usage: pnpm spec:split -- <bundle.yaml> [more...]')
    console.error('       pnpm spec:split --check -- <bundle.yaml>')
    process.exit(1)
  }

  let failed = 0
  for (const p of paths) {
    const resolved = path.resolve(p)
    try {
      if (check) {
        const { ok, mismatches } = await checkSplitBundle(resolved)
        if (ok) {
          console.log(`spec:split:check OK ${path.relative(process.cwd(), resolved)}`)
        } else {
          failed++
          console.error(`spec:split:check FAIL ${path.relative(process.cwd(), resolved)}`)
          for (const m of mismatches) console.error(`  - ${m}`)
        }
      } else {
        const { irDir } = await splitBundleFile(resolved)
        const mdOut = await writeBundleMarkdownFile(resolved)
        const mdNote = mdOut ? ` + ${path.relative(process.cwd(), mdOut)}` : ' (no MD; missing ir/spec.yaml)'
        console.log(`spec:split: ${path.relative(process.cwd(), resolved)} → ${path.relative(process.cwd(), irDir)}/${mdNote}`)
      }
    } catch (error) {
      failed++
      console.error(`spec:split: FAIL ${p}: ${error.message ?? error}`)
    }
  }

  process.exit(failed > 0 ? 1 : 0)
}

main()
