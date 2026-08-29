import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { resolveDocsRoot } from '../config/docs-root.js'
import {
  CANONICAL_DIR,
  expectedCanonicalPath,
  indexIds,
  isRedirectStub,
  kindOf,
  relToRoot,
  walkMdFiles,
  SCAN_MD_DIRS,
  listFlowProcessFiles,
  type IdKind,
} from '../scan/ids.js'
import { depsFromFiles, dependentsOf, validateMdLinks } from '../scan/links.js'
import { routeTopic } from '../scan/route.js'

import { runEngine, type EngineName } from '../cli/engines.js'

function text(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  }
}

async function toolEngine(
  name: EngineName,
  paths: string[] | undefined,
  projectRoot: string | undefined,
  extraArgs: string[] = [],
) {
  try {
    const cwd = resolveDocsRoot(projectRoot)
    const result = await runEngine(name, paths ?? [], { cwd, extraArgs })
    return text({
      ok: result.ok,
      engine: name,
      cwd,
      code: result.code,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    })
  } catch (err) {
    return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
  }
}

function toRelIndex(docsRoot: string) {
  const map = indexIds(docsRoot)
  const out = new Map<
    string,
    { id: string; kind: IdKind; files: string[]; primary?: string }
  >()
  for (const [id, meta] of map) {
    const files = meta.files.map((f) => (path.isAbsolute(f) ? relToRoot(docsRoot, f) : f))
    out.set(id, {
      id,
      kind: meta.kind,
      files,
      primary: files[0],
    })
  }
  return out
}

function chapterHasId(docsRoot: string, id: string): boolean {
  const exp = expectedCanonicalPath(docsRoot, id)
  if (!exp || !fs.existsSync(exp)) return false
  const body = fs.readFileSync(exp, 'utf8')
  return body.includes(id)
}

export function registerTools(server: McpServer): void {
  server.tool('docskit_list_ids',
    'List architecture/product IDs (CMP/FLOW/DEP/ADR/W/API/UI) from docs hub MD (skips redirect stubs)',
    {
      docsRoot: z
        .string()
        .optional()
        .describe('Hub root; defaults to project MCP DOCSKIT_ROOT or a valid cwd'),
      kind: z
        .enum(['CMP', 'FLOW', 'DEP', 'ADR', 'W', 'API', 'UI', 'OTHER', 'ALL'])
        .optional(),
      prefix: z.string().optional(),
    },
    async ({ docsRoot, kind, prefix }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const index = toRelIndex(root)
        let items = [...index.values()]
        if (kind && kind !== 'ALL') items = items.filter((i) => i.kind === kind)
        if (prefix) items = items.filter((i) => i.id.startsWith(prefix))
        items.sort((a, b) => a.id.localeCompare(b.id))
        return text({ docsRoot: root, count: items.length, ids: items })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool('docskit_get_element',
    'Get primary + related files and short excerpts for one ID (canonical path first)',
    {
      id: z.string(),
      docsRoot: z.string().optional(),
      maxChars: z.number().optional().default(1200),
    },
    async ({ id, docsRoot, maxChars }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const index = toRelIndex(root)
        const meta = index.get(id)
        if (!meta) return text({ ok: false, error: 'not_found', id })
        const cap = Math.min(maxChars ?? 1200, 8000)
        const excerpts = meta.files.slice(0, 5).map((rel) => {
          const abs = path.join(root, rel)
          const body = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : ''
          return { file: rel, excerpt: body.slice(0, cap) }
        })
        const expected = expectedCanonicalPath(root, id)
        return text({
          ok: true,
          ...meta,
          canonicalHome: CANONICAL_DIR[meta.kind] ?? null,
          expectedPath: expected ? relToRoot(root, expected) : null,
          excerpts,
        })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool('docskit_deps_of',
    'IDs referenced from files that define/mention this ID',
    {
      id: z.string(),
      docsRoot: z.string().optional(),
    },
    async ({ id, docsRoot }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const index = toRelIndex(root)
        const meta = index.get(id)
        if (!meta) return text({ ok: false, error: 'not_found', id })
        const absFiles = meta.files.map((f) => path.join(root, f))
        const deps = depsFromFiles(absFiles, id)
        return text({ ok: true, id, deps })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool('docskit_dependents_of',
    'Other IDs whose files mention this ID',
    {
      id: z.string(),
      docsRoot: z.string().optional(),
    },
    async ({ id, docsRoot }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const index = indexIds(root)
        if (!index.has(id)) return text({ ok: false, error: 'not_found', id })
        const deps = dependentsOf(id, index, root)
        return text({ ok: true, id, dependents: deps })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool('docskit_orphans',
    'Heuristic orphans vs arc42 layout: missing FLOW/ADR/CMP/W/API files; heading IDs missing from chapter',
    {
      docsRoot: z.string().optional(),
    },
    async ({ docsRoot }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const index = toRelIndex(root)
        const missingCanonical: { id: string; kind: IdKind; expected: string }[] = []
        const missingInChapter: { id: string; kind: IdKind; chapter: string }[] = []

        for (const id of index.keys()) {
          const kind = kindOf(id)
          if (kind === 'FLOW' || kind === 'ADR' || kind === 'CMP' || kind === 'W' || kind === 'API' || kind === 'UI') {
            const exp = expectedCanonicalPath(root, id)
            if (!exp) continue
            const ok =
              fs.existsSync(exp) ||
              fs.existsSync(exp.replace(/\.md$/, '/index.md')) ||
              fs.existsSync(path.dirname(exp))
            // W/API/UI: folder existence counts
            const folderOk =
              (kind === 'W' || kind === 'API' || kind === 'UI') &&
              exp &&
              fs.existsSync(path.dirname(exp))
            if (!ok && !folderOk) {
              const meta = index.get(id)!
              const hasOwn =
                kind === 'FLOW'
                  ? meta.files.some((f) => f.includes(`journeys/${id}`))
                  : meta.primary?.includes(id)
              if (!hasOwn) {
                missingCanonical.push({ id, kind, expected: relToRoot(root, exp) })
              }
            }
            continue
          }

          if (kind === 'DEP') {
            if (!chapterHasId(root, id)) {
              const home = CANONICAL_DIR[kind] ?? '?'
              missingInChapter.push({ id, kind, chapter: `${home}/index.md` })
            }
          }
        }

        const catalogPath = path.join(root, 'architecture/06-runtime/index.md')
        const catalogTbd: string[] = []
        if (fs.existsSync(catalogPath)) {
          for (const line of fs.readFileSync(catalogPath, 'utf8').split('\n')) {
            if (/FLOW-[a-z0-9-]+/i.test(line) && /\bTBD\b|\bdraft\b/i.test(line)) {
              const m = line.match(/FLOW-[A-Za-z0-9-]+/)
              if (m) catalogTbd.push(m[0])
            }
          }
        }

        return text({
          ok: true,
          missingCanonical,
          missingInChapter,
          catalogDraftOrTbd: catalogTbd,
          note: 'Redirect stubs (landscape|context|containers|dynamics|deployments|product/shared/adr) are ignored. DYN-* not indexed.',
        })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool('docskit_validate_links',
    'Find broken MD links under architecture/ + product (skips redirect-stub sources)',
    {
      docsRoot: z.string().optional(),
      includeProduct: z.boolean().optional().default(true),
    },
    async ({ docsRoot, includeProduct }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const dirs = includeProduct
          ? ['architecture', 'Overview', 'Surfaces', 'Architecture']
          : ['architecture']
        const files = walkMdFiles(root, dirs).filter((f) => !isRedirectStub(f, root))
        const broken = validateMdLinks(root, files).map((h) => ({
          ...h,
          file: relToRoot(root, h.file),
        }))
        return text({
          ok: broken.length === 0,
          brokenCount: broken.length,
          broken: broken.slice(0, 100),
        })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool('docskit_route',
    'Map a natural-language topic to arc42 chapter path + skill (/architecture router helper)',
    {
      topic: z.string().describe('e.g. "login sequence", "ADR auth"'),
    },
    async ({ topic }) => {
      return text({ ok: true, topic, routes: routeTopic(topic) })
    },
  )

  server.tool('docskit_business_processes',
    'List FLOW-* under architecture/03-business-process and product/surfaces/**/common/processes',
    {
      docsRoot: z.string().optional(),
    },
    async ({ docsRoot }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const processes = listFlowProcessFiles(root)
        return text({
          ok: true,
          count: processes.length,
          catalog: 'architecture/03-business-process/index.md',
          processes,
        })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool('docskit_layout',
    'Describe expected arc42 × C4 docs hub layout (canonical paths per ID kind)',
    {},
    async () => {
      return text({
        ok: true,
        chapters: 'architecture/01 … architecture/12',
        redirectStubsIgnored: [
          'architecture/landscape',
          'architecture/context',
          'architecture/containers',
          'architecture/dynamics',
          'architecture/deployments',
          'product/shared/adr',
        ],
        idHomes: CANONICAL_DIR,
        scanDirs: SCAN_MD_DIRS,
        notes: [
          'DEP is a heading inside chapter index.md — not separate files',
          'FLOW-* under architecture/03-business-process/ and product/surfaces/**/common/processes/',
          'ADR-* under architecture/09-decisions/',
          'CMP/W/API/UI under Surfaces/ — never under architecture/05 code/',
          'DYN-* deprecated — use FLOW-* + /business-process',
        ],
      })
    },
  )
  const rootField = {
    projectRoot: z
      .string()
      .optional()
      .describe('Docs hub root; defaults to DOCSKIT_ROOT or cwd'),
  }

  server.tool('docskit_bundle_split',
    'Split one or more *.bundle.yaml files into ir/* and colocated spec Markdown (docs-hub)',
    {
      ...rootField,
      paths: z.array(z.string()).describe('Bundle YAML paths relative to project root or absolute'),
    },
    async ({ projectRoot, paths }) => toolEngine('split', paths, projectRoot),
  )

  server.tool('docskit_bundle_merge',
    'Merge ir/* back into *.bundle.yaml',
    {
      ...rootField,
      paths: z.array(z.string()),
    },
    async ({ projectRoot, paths }) => toolEngine('merge', paths, projectRoot),
  )

  server.tool('docskit_bundle_check',
    'Check that ir/* matches split output for bundles',
    {
      ...rootField,
      paths: z.array(z.string()),
    },
    async ({ projectRoot, paths }) => toolEngine('check', paths, projectRoot),
  )

  server.tool('docskit_bundle_split_all',
    'Split all bundles under a yaml root (default product or --root)',
    {
      ...rootField,
      root: z.string().optional().describe('Optional yaml root relative to project'),
      check: z.boolean().optional(),
    },
    async ({ projectRoot, root, check }) => {
      const extra: string[] = []
      if (root) extra.push('--root', root)
      if (check) extra.push('--check')
      return toolEngine('split_all', [], projectRoot, extra)
    },
  )

  server.tool('docskit_bundle_normalize',
    'Normalize bundle.gen sections',
    {
      ...rootField,
      paths: z.array(z.string()),
    },
    async ({ projectRoot, paths }) => toolEngine('normalize', paths, projectRoot),
  )

  server.tool('docskit_docs_render',
    'Render design Markdown from product YAML/bundles (no testcase MD)',
    {
      ...rootField,
      yamlRoot: z.string().optional(),
      mdRoot: z.string().optional(),
      legacyRoot: z.string().optional(),
      noIndex: z.boolean().optional().default(true),
    },
    async ({ projectRoot, yamlRoot, mdRoot, legacyRoot, noIndex }) => {
      const extra: string[] = []
      if (yamlRoot) extra.push('--yaml-root', yamlRoot)
      if (mdRoot) extra.push('--md-root', mdRoot)
      if (legacyRoot) extra.push('--legacy-root', legacyRoot)
      if (noIndex !== false) extra.push('--no-index')
      return toolEngine('render', [], projectRoot, extra)
    },
  )

  server.tool('docskit_docs_publish',
    'Write CATALOG.md + README link from existing ir/generated + qa/index.md (does not re-render specs)',
    {
      ...rootField,
    },
    async ({ projectRoot }) => toolEngine('publish', [], projectRoot),
  )

  server.tool('docskit_docs_render_common',
    'Render common UI design MD under Surfaces/Common',
    {
      ...rootField,
    },
    async ({ projectRoot }) => {
      const rootPath = projectRoot || process.cwd()
      const isLowercase = fs.existsSync(path.join(rootPath, 'product', 'surfaces', 'common'))
      const yamlRoot = isLowercase ? 'product/surfaces/common/yaml' : 'Surfaces/Common/yaml'
      const mdRoot = isLowercase ? 'product/surfaces/common/md' : 'Surfaces/Common/md'
      const legacyRoot = isLowercase ? 'product/surfaces/common' : 'Surfaces/Common'
      return toolEngine('render', [], projectRoot, [
        '--yaml-root',
        yamlRoot,
        '--md-root',
        mdRoot,
        '--legacy-root',
        legacyRoot,
        '--no-index',
      ])
    },
  )

  server.tool('docskit_legacy_dynamics_validate',
    'Validate portal-legacy-dynamics YAML module files',
    {
      ...rootField,
      paths: z.array(z.string()),
    },
    async ({ projectRoot, paths }) => toolEngine('legacy_validate', paths, projectRoot),
  )
}
