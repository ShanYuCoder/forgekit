#!/usr/bin/env node
/**
 * Partition bundle.spec → design + bundle.gen (portal-feature-bundle/v1).
 * Usage: pnpm spec:normalize-gen -- <bundle.yaml> [--write]
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'
import { hasGenContent, partitionSpecSection } from './lib/bundle-schema.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

async function normalizeBundle(bundlePath, write = false) {
  const absolute = path.resolve(bundlePath)
  const bundle = parse(await readFile(absolute, 'utf8')) ?? {}
  const { designSpec, gen } = partitionSpecSection(bundle.spec ?? {}, bundle.gen ?? {})

  if (designSpec.ui?.screens) {
    const screen = designSpec.ui.screens[0]
    if (screen?.layout?.length) {
      bundle.review = bundle.review ?? {}
      bundle.review.layoutNotes = screen.layout
    }
    if (screen?.actions?.length) {
      bundle.design = bundle.design ?? {}
      bundle.design.actions = screen.actions
    }
    delete designSpec.ui.screens
  }

  bundle.spec = designSpec
  if (hasGenContent(gen)) bundle.gen = gen
  else delete bundle.gen

  if (write) {
    await writeFile(absolute, stringify(bundle, { lineWidth: 0 }), 'utf8')
  }

  return { bundlePath: absolute, hasGen: hasGenContent(gen) }
}

async function main() {
  const args = process.argv.slice(2)
  const write = args.includes('--write')
  const paths = args.filter((a) => !a.startsWith('-'))

  if (!paths.length) {
    console.error('Usage: pnpm spec:normalize-gen -- <bundle.yaml> [--write]')
    process.exit(1)
  }

  let failed = 0
  for (const p of paths) {
    try {
      const { bundlePath, hasGen } = await normalizeBundle(p, write)
      console.log(
        `spec:normalize-gen: ${path.relative(root, bundlePath)}${hasGen ? ' (+gen)' : ''}${write ? ' [written]' : ' [dry]'}`
      )
    } catch (error) {
      failed++
      console.error(`spec:normalize-gen: FAIL ${p}: ${error.message ?? error}`)
    }
  }

  process.exit(failed > 0 ? 1 : 0)
}

main()
