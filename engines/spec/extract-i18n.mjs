#!/usr/bin/env node
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

const SKIP_DIRS = new Set(['node_modules', '.git', 'ir', 'generated', 'dist', 'cache'])

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
  let root = process.cwd()
  const args = process.argv.slice(2)
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--root' && args[i + 1]) {
      root = path.resolve(args[++i])
    }
  }

  const bundles = await globBundles(root)
  if (!bundles.length) {
    console.log(`spec:i18n: no *.bundle.yaml found under ${path.relative(process.cwd(), root) || root}`)
    return
  }

  const registry = {}
  let conflicts = 0

  for (const bundlePath of bundles) {
    try {
      const rawYaml = await readFile(bundlePath, 'utf8')
      const bundle = parse(rawYaml) || {}
      
      const i18n = { ...(bundle.i18n || {}), ...(bundle.design?.i18n || {}) }
      
      for (const [key, value] of Object.entries(i18n)) {
        if (registry[key] !== undefined && registry[key] !== value) {
          console.warn(`[Warning] Conflict i18n key '${key}': '${registry[key]}' vs '${value}' (in ${path.relative(process.cwd(), bundlePath)})`)
          conflicts++
        }
        registry[key] = value
      }
    } catch (error) {
      console.error(`spec:i18n: Error parsing ${bundlePath}:`, error.message)
    }
  }

  const outDir = path.resolve(process.cwd(), 'registries')
  await mkdir(outDir, { recursive: true })
  const outFile = path.join(outDir, 'i18n.registry.json')
  
  await writeFile(outFile, JSON.stringify(registry, null, 2), 'utf8')
  
  console.log(`spec:i18n: Extracted ${Object.keys(registry).length} keys to registries/i18n.registry.json (${conflicts} conflicts)`)
}

main()
