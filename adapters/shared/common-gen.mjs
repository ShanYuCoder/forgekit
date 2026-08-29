/**
 * Inventory + stub codegen for docs common UI (surface or module).
 *
 *   node adapters/shared/common-gen.mjs [--surface=admin-web] [--module=CMP-ADM-009]
 *     [--id=common-status-chip] [--dry-run] [--force] [--json] [--all-surfaces] [--all-modules]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const here = path.dirname(fileURLToPath(import.meta.url))
const CATALOG_PATH = path.join(here, 'common-ui.catalog.json')
const WEB_ADAPTERS = new Set(['nuxt4', 'nextjs'])

export function loadCatalog(catalogPath = CATALOG_PATH) {
  return JSON.parse(readFileSync(catalogPath, 'utf8'))
}

export function parseCommonGenArgs(argv) {
  const options = {
    dryRun: false,
    force: false,
    json: false,
    allSurfaces: false,
    allModules: false,
    surface: null,
    module: null,
    id: null,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run' || arg === '--dry') options.dryRun = true
    else if (arg === '--force') options.force = true
    else if (arg === '--json') options.json = true
    else if (arg === '--all-surfaces') options.allSurfaces = true
    else if (arg === '--all-modules') options.allModules = true
    else if (arg === '--surface') options.surface = argv[++i]
    else if (arg?.startsWith('--surface=')) options.surface = arg.slice('--surface='.length)
    else if (arg === '--module') options.module = argv[++i]
    else if (arg?.startsWith('--module=')) options.module = arg.slice('--module='.length)
    else if (arg === '--id') options.id = argv[++i]
    else if (arg?.startsWith('--id=')) options.id = arg.slice('--id='.length)
  }
  return options
}

export function resolveDocsRoot(projectRoot) {
  const env = process.env.CODEGENKIT_DOCS_ROOT || process.env.DOCSKIT_ROOT
  if (env) return path.resolve(env)
  throw new Error('Set CODEGENKIT_DOCS_ROOT or pass --docs-root; no sibling docs hub is assumed')
}

function toPascalCase(value) {
  return String(value)
    .replace(/^common-/, '')
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (m) => m.toUpperCase())
}

function toKebabCase(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

function readSpecMeta(specPath) {
  if (!existsSync(specPath)) return {}
  try {
    const doc = parseYaml(readFileSync(specPath, 'utf8')) ?? {}
    return {
      id: typeof doc.id === 'string' ? doc.id : null,
      title: typeof doc.title === 'string' ? doc.title : null,
      summary: typeof doc.summary === 'string' ? doc.summary : null,
    }
  } catch {
    return {}
  }
}

export function listSurfaceCommonDirs(docsRoot) {
  const surfacesDir = path.join(docsRoot, 'product', 'surfaces')
  if (!existsSync(surfacesDir)) return []
  const out = []
  for (const entry of readdirSync(surfacesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const yamlDir = path.join(surfacesDir, entry.name, 'common', 'yaml')
    if (existsSync(yamlDir)) {
      out.push({ scope: 'surface', surface: entry.name, module: null, yamlDir })
    }
  }
  return out.sort((a, b) => a.surface.localeCompare(b.surface))
}

export function listModuleCommonDirs(docsRoot) {
  const surfacesDir = path.join(docsRoot, 'product', 'surfaces')
  if (!existsSync(surfacesDir)) return []
  const out = []
  for (const surface of readdirSync(surfacesDir, { withFileTypes: true })) {
    if (!surface.isDirectory() || surface.name.startsWith('.') || surface.name === 'common') continue
    const surfacePath = path.join(surfacesDir, surface.name)
    for (const child of readdirSync(surfacePath, { withFileTypes: true })) {
      if (!child.isDirectory() || !child.name.startsWith('CMP-')) continue
      const yamlDir = path.join(surfacePath, child.name, 'common', 'yaml')
      const commonDir = path.join(surfacePath, child.name, 'common')
      if (existsSync(yamlDir)) {
        out.push({ scope: 'module', surface: surface.name, module: child.name, yamlDir })
      } else if (existsSync(commonDir)) {
        out.push({ scope: 'module', surface: surface.name, module: child.name, yamlDir: null })
      }
    }
  }
  return out.sort((a, b) => a.module.localeCompare(b.module) || a.surface.localeCompare(b.surface))
}

function inferEntry(slug, adapter, ctx = {}) {
  const id = slug.startsWith('common-') ? slug : `common-${slug}`
  const pascal = toPascalCase(id)
  const kebab = toKebabCase(pascal)
  const symbol = pascal.startsWith('Mo') ? pascal : `Mo${pascal}`
  let rel
  if (ctx.scope === 'module' && ctx.module) {
    const folder = toKebabCase(ctx.module)
    rel =
      adapter === 'nextjs'
        ? `src/components/modules/${folder}/mo-${kebab}.tsx`
        : `components/modules/${folder}/${pascal}.vue`
  } else {
    rel =
      adapter === 'nextjs'
        ? `src/components/molecules/mo-${kebab}.tsx`
        : `components/molecules/${pascal}.vue`
  }
  return {
    kind: 'molecule',
    emit: true,
    symbol,
    tag: `#common:${slug.replace(/^common-/, '')}`,
    targets: { [adapter]: { path: rel } },
    inferred: true,
  }
}

function catalogEntryFor(catalog, id, slug, adapter, ctx = {}) {
  if ((catalog.skipSlugs ?? []).includes(slug) || (catalog.skipSlugs ?? []).includes(id)) {
    return { kind: 'skip', emit: false, skip: true }
  }
  const known = catalog.entries?.[id] ?? catalog.entries?.[slug]
  if (known) {
    if (ctx.scope === 'module' && known.emit !== false) {
      const inferred = inferEntry(slug, adapter, ctx)
      return { ...known, targets: inferred.targets, inferred: true }
    }
    return known
  }
  return inferEntry(slug, adapter, ctx)
}

function existingPath(projectRoot, target) {
  if (!target?.path) return null
  const candidates = [target.path, ...(target.also ?? [])]
  for (const rel of candidates) {
    const abs = path.join(projectRoot, rel)
    if (existsSync(abs)) return rel
  }
  return null
}

function extraTargets(entry, adapter) {
  const extras = []
  for (const extra of entry.extra ?? []) {
    const rel = extra[adapter]
    if (rel) extras.push({ symbol: extra.symbol, path: rel })
  }
  return extras
}

function stubSource({ adapter, symbol, id, specRel }) {
  if (adapter === 'nextjs') {
    return `'use client';

import type { ReactNode } from 'react';

/**
 * Surface common: ${id}
 * Spec: ${specRel}
 * Fill from ir/spec.yaml via /gen-common. Do not page-gen this IR.
 */
export function ${symbol}({
  testId,
  children,
}: {
  testId?: string;
  children?: ReactNode;
}) {
  return (
    <div data-testid={testId} data-common-id="${id}">
      {children}
    </div>
  );
}
`
  }
  return `<script setup lang="ts">
/**
 * Surface common: ${id}
 * Spec: ${specRel}
 * Fill from ir/spec.yaml via /gen-common. Do not page-gen this IR.
 */
defineProps<{ testId?: string }>()
</script>

<template>
  <div :data-testid="testId" data-common-id="${id}" />
</template>
`
}

function kindRank(catalog, kind) {
  const order = catalog.kindOrder ?? ['tokens', 'policy', 'molecule', 'shell', 'flow']
  const idx = order.indexOf(kind)
  return idx < 0 ? order.length : idx
}

export function inventorySurface(opts) {
  const {
    docsRoot,
    projectRoot,
    adapter,
    surface,
    module: moduleId = null,
    scope = 'surface',
    yamlDir,
    catalog,
    idFilter,
  } = opts
  const entries = []
  if (!yamlDir) return entries
  let slugs = []
  try {
    slugs = readdirSync(yamlDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort()
  } catch {
    return entries
  }

  const ctx = { scope, module: moduleId }

  for (const slug of slugs) {
    const specPath = path.join(yamlDir, slug, 'ir', 'spec.yaml')
    const designPath = path.join(yamlDir, slug, 'ir', 'design.yaml')
    if (!existsSync(specPath) && !existsSync(designPath)) continue

    const meta = readSpecMeta(specPath)
    const id = meta.id || (slug.startsWith('common-') ? slug : `common-${slug}`)
    if (idFilter && id !== idFilter && slug !== idFilter) continue

    const def = catalogEntryFor(catalog, id, slug, adapter, ctx)
    if (def.skip) {
      entries.push({
        id,
        slug,
        surface,
        module: moduleId,
        scope,
        kind: 'skip',
        emit: false,
        action: 'skip',
        status: 'skipped',
        specPath: existsSync(specPath) ? specPath : null,
        designPath: existsSync(designPath) ? designPath : null,
        title: meta.title,
        summary: def.summary ?? meta.summary,
      })
      continue
    }

    const target = def.targets?.[adapter] ?? null
    const found = existingPath(projectRoot, target)
    const extras = extraTargets(def, adapter).map((extra) => ({
      ...extra,
      exists: existsSync(path.join(projectRoot, extra.path)),
    }))
    const emit = Boolean(def.emit && target?.path)
    const missingExtras = extras.filter((e) => !e.exists)
    let status = 'policy'
    let action = 'apply-when-implementing'
    if (emit) {
      if (found && missingExtras.length === 0) {
        status = 'implemented'
        action = 'skip-existing'
      } else if (found || extras.some((e) => e.exists)) {
        status = 'partial'
        action = 'implement'
      } else {
        status = 'missing'
        action = 'implement'
      }
    }

    entries.push({
      id,
      slug,
      surface,
      module: moduleId,
      scope,
      kind: def.kind,
      emit,
      inferred: Boolean(def.inferred),
      symbol: def.symbol ?? null,
      tag: def.tag ?? `#common:${slug}`,
      dependsOn: def.dependsOn ?? [],
      title: meta.title,
      summary: def.summary ?? meta.summary,
      specPath: existsSync(specPath) ? specPath : null,
      designPath: existsSync(designPath) ? designPath : null,
      specRel: existsSync(specPath)
        ? path.relative(docsRoot, specPath).split(path.sep).join('/')
        : null,
      target: target?.path ?? null,
      also: target?.also ?? [],
      existingPath: found,
      extras,
      status,
      action,
    })
  }

  return entries.sort((a, b) => {
    const rank = kindRank(catalog, a.kind) - kindRank(catalog, b.kind)
    return rank !== 0 ? rank : a.id.localeCompare(b.id)
  })
}

export function selectSources(surfaceListed, moduleListed, options) {
  const moduleId = options.module || process.env.CODEGENKIT_MODULE || null
  if (moduleId || options.allModules) {
    let match = moduleListed
    if (moduleId) {
      match = match.filter(
        (m) => m.module === moduleId || m.module.toLowerCase() === String(moduleId).toLowerCase(),
      )
    }
    const surface = options.surface || process.env.CODEGENKIT_SURFACE || null
    if (surface) match = match.filter((m) => m.surface === surface)
    if (!match.length) {
      const names = moduleListed.map((m) => `${m.surface}/${m.module}`).join(', ') || '(none)'
      throw new Error(
        moduleId
          ? `Unknown --module=${moduleId}. Found: ${names}`
          : `No module common/ under docs hub. Found: ${names}`,
      )
    }
    if (!moduleId && !options.surface && !options.allSurfaces) {
      const surfaces = [...new Set(match.map((m) => m.surface))]
      if (surfaces.length > 1) {
        throw new Error(
          `Multiple surfaces have module common/: ${surfaces.join(', ')}. Pass --surface=<name> with --all-modules.`,
        )
      }
    }
    return match
  }
  return selectSurfaces(surfaceListed, options)
}

export function selectSurfaces(listed, options) {
  const explicit = options.surface || process.env.CODEGENKIT_SURFACE || null
  if (explicit) {
    const match = listed.filter((s) => s.surface === explicit)
    if (!match.length) {
      const names = listed.map((s) => s.surface).join(', ') || '(none)'
      throw new Error(`Unknown --surface=${explicit}. Found: ${names}`)
    }
    return match
  }
  if (options.allSurfaces || listed.length <= 1) return listed
  throw new Error(
    `Multiple surfaces have common/: ${listed.map((s) => s.surface).join(', ')}. Pass --surface=<name> or --all-surfaces.`,
  )
}

function upsertCommonRegistry(projectRoot, entries, surface, dryRun) {
  const registryPath = path.join(projectRoot, 'registries', 'common.registry.json')
  let doc = {
    version: 1,
    description: `FE surface common UI — product/surfaces/${surface}/common`,
    entries: {},
    aliasIndex: {},
  }
  if (existsSync(registryPath)) {
    try {
      doc = JSON.parse(readFileSync(registryPath, 'utf8'))
      doc.entries = doc.entries ?? {}
      doc.aliasIndex = doc.aliasIndex ?? {}
    } catch {
      // keep defaults
    }
  }

  const emitEntries = entries.filter((e) => e.emit && e.target && e.symbol)
  for (const item of emitEntries) {
    const key = item.scope === 'module' && item.module ? `${item.module}/${item.id}` : item.id
    const previous = doc.entries[key]
    const implemented = item.status === 'implemented' || item.action === 'wrote'
    doc.entries[key] = {
      ...(previous ?? {}),
      status: implemented ? 'implemented' : 'planned',
      tag: item.tag,
      kind: item.kind,
      path: item.existingPath ?? item.target,
      symbol: item.symbol,
      summary: item.summary || item.title || item.id,
      usedBy: previous?.usedBy ?? [],
      specRefs: [item.specRel].filter(Boolean),
    }
    if (item.symbol) {
      const alias = item.module ? `${item.module}:${item.symbol}` : item.symbol
      doc.aliasIndex[alias] = key
    }
    const idAlias = item.module ? `${item.module}/${item.id}` : item.id
    doc.aliasIndex[idAlias] = key
    if (item.slug && item.slug !== item.id) {
      const slugAlias = item.module ? `${item.module}/${item.slug}` : item.slug
      doc.aliasIndex[slugAlias] = key
    }
  }

  if (dryRun) return { path: registryPath, wrote: false, entries: emitEntries.length }
  mkdirSync(path.dirname(registryPath), { recursive: true })
  writeFileSync(registryPath, `${JSON.stringify(doc, null, 2)}\n`)
  return { path: registryPath, wrote: true, entries: emitEntries.length }
}

function writeStubs(projectRoot, adapter, entries, { dryRun, force }) {
  const written = []
  const skipped = []
  for (const item of entries) {
    if (!item.emit || !item.target || !item.symbol) continue
    const abs = path.join(projectRoot, item.target)
    if (existsSync(abs) && !force) {
      skipped.push(item.target)
      continue
    }
    if (item.existingPath && item.existingPath !== item.target && !force) {
      skipped.push(`${item.target} (exists as ${item.existingPath})`)
      continue
    }
    if (!dryRun) {
      mkdirSync(path.dirname(abs), { recursive: true })
      writeFileSync(
        abs,
        stubSource({
          adapter,
          symbol: item.symbol,
          id: item.id,
          specRel: item.specRel ?? item.id,
        }),
      )
    }
    written.push(item.target)
    item.action = dryRun ? 'would-write' : 'wrote'
    item.status = dryRun ? item.status : 'implemented'
    item.existingPath = item.target
  }
  return { written, skipped }
}

export function runCommonGen(opts) {
  const adapter = opts.adapter
  if (!WEB_ADAPTERS.has(adapter)) {
    throw new Error('gen-common is web FE only (nuxt4 | nextjs)')
  }
  const projectRoot = path.resolve(opts.projectRoot)
  const docsRoot = path.resolve(opts.docsRoot)
  const catalog = opts.catalog ?? loadCatalog()
  const surfaceListed = listSurfaceCommonDirs(docsRoot)
  const moduleListed = listModuleCommonDirs(docsRoot)
  const sources = selectSources(surfaceListed, moduleListed, opts)
  if (!sources.length) {
    throw new Error(
      `No product/surfaces/<surface>/common or <CMP-*>/common under ${docsRoot}. Run Docskit split first.`,
    )
  }
  const notes = []
  const entries = sources.flatMap((s) => {
    if (!s.yamlDir) {
      notes.push(`${s.surface}/${s.module}: common/ has no yaml/ir yet (docs-only)`)
      return []
    }
    return inventorySurface({
      docsRoot,
      projectRoot,
      adapter,
      surface: s.surface,
      module: s.module,
      scope: s.scope ?? (s.module ? 'module' : 'surface'),
      yamlDir: s.yamlDir,
      catalog,
      idFilter: opts.id,
    })
  })
  if (opts.id && !entries.length && !notes.length) {
    throw new Error(`No common spec matching --id=${opts.id}`)
  }

  const dryRun = Boolean(opts.dryRun)
  const force = Boolean(opts.force)
  const stub = writeStubs(projectRoot, adapter, entries, { dryRun, force })
  const label = sources
    .map((s) => (s.module ? `${s.surface}/${s.module}` : s.surface))
    .join(',')
  const registry = upsertCommonRegistry(projectRoot, entries, label, dryRun)

  return {
    ok: true,
    mode: dryRun ? 'dry-run' : 'write',
    adapter,
    docsRoot,
    projectRoot,
    scope: sources[0]?.module ? 'module' : 'surface',
    surfaces: [...new Set(sources.map((s) => s.surface))],
    modules: [...new Set(sources.map((s) => s.module).filter(Boolean))],
    notes,
    entries,
    stubs: stub,
    registry: {
      path: path.relative(projectRoot, registry.path).split(path.sep).join('/'),
      wrote: registry.wrote,
    },
  }
}

function formatHuman(report) {
  const scope = report.modules?.length
    ? `modules=${report.modules.join(',')}`
    : `surfaces=${report.surfaces.join(',')}`
  const lines = [
    `gen-common: ${report.mode} adapter=${report.adapter} ${scope}`,
    `  docsRoot: ${report.docsRoot}`,
  ]
  for (const note of report.notes ?? []) {
    lines.push(`  note: ${note}`)
  }
  for (const item of report.entries) {
    const target = item.target ? ` → ${item.existingPath ?? item.target}` : ''
    const loc = item.module ? `${item.module}/` : ''
    lines.push(`  ${item.status.padEnd(12)} ${item.kind.padEnd(8)} ${loc}${item.id}${target}`)
  }
  const missing = report.entries.filter((e) => e.action === 'implement' || e.action === 'would-write')
  if (report.stubs.written.length) {
    lines.push(`  stubs ${report.mode === 'dry-run' ? 'would write' : 'wrote'}: ${report.stubs.written.join(', ')}`)
  }
  if (report.stubs.skipped.length) {
    lines.push(`  stubs skipped: ${report.stubs.skipped.join(', ')}`)
  }
  lines.push(
    `  registry ${report.registry.wrote ? 'wrote' : 'would write'}: ${report.registry.path}`,
  )
  if (missing.length) {
    lines.push(`  next: /gen-common implement ${missing.length} spec(s) from ir/spec.yaml (shadcn compose, then re-run gen-common)`)
  }
  return `${lines.join('\n')}\n`
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseCommonGenArgs(argv)
  const adapter = process.env.CODEGENKIT_ADAPTER || process.env.CODEGENKIT_FE_ADAPTER || 'nuxt4'
  const projectRoot = process.env.CODEGENKIT_ROOT || process.cwd()
  const docsRoot = resolveDocsRoot(projectRoot)
  const report = runCommonGen({
    adapter,
    projectRoot,
    docsRoot,
    dryRun: options.dryRun,
    force: options.force,
    surface: options.surface,
    module: options.module,
    allSurfaces: options.allSurfaces,
    allModules: options.allModules,
    id: options.id,
  })
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  } else {
    process.stdout.write(formatHuman(report))
  }
}

const entry = process.argv[1] ?? ''
if (path.basename(entry) === 'common-gen.mjs') {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
