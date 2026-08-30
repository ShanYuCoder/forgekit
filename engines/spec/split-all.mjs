#!/usr/bin/env node
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { splitBundleFile, checkSplitBundle } from './lib/bundle-ir.mjs'
import { writeBundleMarkdownFile } from '../docs/lib/render-bundle-markdown.mjs'

const SKIP_DIRS = new Set(['node_modules', '.git', 'ir', 'generated', 'dist', 'cache'])

function parseCli(argv) {
  const args = argv.slice(2)
  let root = 'product'
  let check = false
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--root' && args[i + 1]) {
      root = args[++i]
      continue
    }
    if (args[i] === '--check') check = true
  }
  return { root: path.resolve(root), check }
}

async function globBundles(dir) {
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
      if (SKIP_DIRS.has(entry.name)) continue
      files.push(...(await globBundles(entryPath)))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.bundle.yaml')) files.push(entryPath)
  }
  return files.sort()
}

async function main() {
  const { root: ROOT, check } = parseCli(process.argv)
  const bundles = await globBundles(ROOT)

  if (!bundles.length) {
    console.log(`spec:split:all: no *.bundle.yaml found under ${path.relative(process.cwd(), ROOT) || ROOT}`)
    return
  }

  let failed = 0
  for (const bundlePath of bundles) {
    const rel = path.relative(process.cwd(), bundlePath)
    try {
      if (check) {
        const { ok, mismatches } = await checkSplitBundle(bundlePath)
        if (ok) console.log(`✔ spec:split:all:check ${rel}`)
        else {
          failed++
          console.error(`✖ spec:split:all:check ${rel}: ${mismatches.join('; ')}`)
        }
        continue
      }
      await splitBundleFile(bundlePath)
      await writeBundleMarkdownFile(bundlePath)
      console.log(`✔ spec:split:all ${rel}`)
    } catch (error) {
      failed++
      console.error(`✖ spec:split:all ${rel}: ${error.message ?? error}`)
    }
  }

  console.log(`\nspec:split:all: ${bundles.length - failed}/${bundles.length} bundle(s) ${check ? 'checked' : 'split'}`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
