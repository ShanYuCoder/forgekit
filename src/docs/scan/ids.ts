import fs from 'node:fs'
import path from 'node:path'

export type IdKind =
  | 'CMP'
  | 'FLOW'
  | 'DEP'
  | 'ADR'
  | 'W'
  | 'API'
  | 'UI'
  | 'OTHER'

export type HubId = {
  id: string
  kind: IdKind
  files: string[]
  /** First file under the canonical chapter/product path when known */
  primary?: string
}

/** Old flat C4 + ADR paths — redirect stubs only (not SSOT). */
const REDIRECT_STUB_RE =
  /(?:^|\/)architecture\/(?:landscape|context|containers|dynamics|deployments)(?:\/|$)|(?:^|\/)product\/shared\/adr(?:\/|$)/

const ID_RE =
  /\b((?:CMP|FLOW|DEP|ADR|SC|TC)-[A-Za-z0-9][A-Za-z0-9_-]*|(?:W|API|UI)-[A-Z]{2}-[A-Z0-9]+-\d{3})\b/g

/** Scan roots for MD (arc42 × product). */
export const SCAN_MD_DIRS = [
  'architecture',
  'product/overview',
  'product/surfaces',
] as const

/** Canonical home for each ID kind (architecture-core). */
export const CANONICAL_DIR: Partial<Record<IdKind, string>> = {
  FLOW: 'architecture/03-business-process',
  DEP: 'architecture/07-deployment',
  ADR: 'architecture/09-decisions',
  CMP: 'product/surfaces',
  W: 'product/surfaces',
  API: 'product/surfaces',
  UI: 'product/surfaces',
}

export function kindOf(id: string): IdKind {
  const p = id.split('-')[0]
  if (['CMP', 'FLOW', 'DEP', 'ADR', 'W', 'API', 'UI'].includes(p)) {
    return p as IdKind
  }
  return 'OTHER'
}

export function isRedirectStub(relOrAbs: string, docsRoot?: string): boolean {
  const rel = docsRoot
    ? path.relative(docsRoot, path.isAbsolute(relOrAbs) ? relOrAbs : path.join(docsRoot, relOrAbs))
    : relOrAbs
  return REDIRECT_STUB_RE.test(rel.split(path.sep).join('/'))
}

export function walkMdFiles(root: string, relDirs: string[]): string[] {
  const out: string[] = []
  for (const rel of relDirs) {
    const base = path.join(root, rel)
    if (!fs.existsSync(base)) continue
    walk(base, out)
  }
  return out
}

function walk(dir: string, out: string[]) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else if (/\.(md|markdown)$/i.test(ent.name)) out.push(p)
  }
}

export function extractIdsFromText(text: string): Set<string> {
  const s = new Set<string>()
  for (const m of text.matchAll(ID_RE)) {
    const id = m[1]
    // DYN-* deprecated — do not index as live IDs
    if (id.startsWith('DYN-')) continue
    s.add(id)
  }
  return s
}

function fileRank(docsRoot: string, id: string, absFile: string): number {
  const rel = relToRoot(docsRoot, absFile)
  if (isRedirectStub(rel)) return 100
  const kind = kindOf(id)
  if (kind === 'FLOW' && path.basename(absFile).startsWith(id)) {
    if (rel.startsWith('architecture/03-business-process') || rel.includes('/common/processes/')) return 0
  }
  const home = CANONICAL_DIR[kind]
  if (home && rel.startsWith(home)) {
    if (kind === 'ADR' && path.basename(absFile).startsWith(id.split('-').slice(0, 2).join('-'))) {
      return 0
    }
    if (kind === 'CMP' && (rel.includes(`/${id}`) || rel.includes(`/${id}/`))) return 0
    if ((kind === 'W' || kind === 'API' || kind === 'UI') && rel.includes(`/${id}/`)) return 0
    return 1
  }
  return 10
}

function sortFiles(docsRoot: string, id: string, files: string[]): string[] {
  return [...files].sort(
    (a, b) => fileRank(docsRoot, id, a) - fileRank(docsRoot, id, b) || a.localeCompare(b),
  )
}

export function indexIds(docsRoot: string): Map<string, HubId> {
  const files = walkMdFiles(docsRoot, [...SCAN_MD_DIRS]).filter((f) => !isRedirectStub(f, docsRoot))
  const map = new Map<string, HubId>()

  for (const f of files) {
    const base = path.basename(f, path.extname(f))
    if (/^FLOW-/.test(base)) add(map, base, f)

    const adr = base.match(/^(ADR-\d+)/)
    if (adr) {
      add(map, adr[1], f)
      add(map, base, f) // ADR-001-arc42-toc slug form
    }

    // Hub path: product/surfaces/<surface>/CMP-*/...
    // Legacy: product/surfaces/<surface>/modules/CMP-*/...
    const cmpFolder = f.match(
      /[\\/]product[\\/]surfaces[\\/][^\\/]+[\\/](?:modules[\\/])?(CMP-[A-Za-z0-9][A-Za-z0-9_-]*)[\\/]/i,
    )
    if (cmpFolder) {
      add(map, cmpFolder[1], f)
      const short = cmpFolder[1].match(/^(CMP-[A-Za-z0-9]+)/)
      if (short) add(map, short[1], f)
    }

    // Code folders: product/surfaces/.../CMP-*/<slug>/code/{W|API|UI}-*
    const codeFolder = f.match(/[\\/]code[\\/]((?:W|API|UI)-[A-Z]{2}-[A-Z0-9]+-\d{3})[\\/]/i)
    if (codeFolder) add(map, codeFolder[1], f)
  }

  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8')
    for (const id of extractIdsFromText(text)) add(map, id, f)
  }

  for (const [id, meta] of map) {
    meta.files = sortFiles(docsRoot, id, meta.files)
    meta.primary = meta.files[0]
  }

  return map
}

function add(map: Map<string, HubId>, id: string, file: string) {
  const existing = map.get(id)
  if (existing) {
    if (!existing.files.includes(file)) existing.files.push(file)
  } else {
    map.set(id, { id, kind: kindOf(id), files: [file] })
  }
}

export function relToRoot(docsRoot: string, abs: string): string {
  return path.relative(docsRoot, abs).split(path.sep).join('/')
}

function flowMetaFromFile(docsRoot: string, abs: string) {
  const head = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8').split('\n').slice(0, 12).join('\n') : ''
  return {
    id: path.basename(abs, '.md'),
    file: relToRoot(docsRoot, abs),
    domain: head.match(/^domain:\s*(.+)$/m)?.[1]?.trim(),
    status: head.match(/^status:\s*(.+)$/m)?.[1]?.trim(),
  }
}

/** Catalog FLOW-*.md plus LCA common/processes (dedupe by id, catalog wins). */
export function listFlowProcessFiles(docsRoot: string): ReturnType<typeof flowMetaFromFile>[] {
  const byId = new Map<string, ReturnType<typeof flowMetaFromFile>>()
  const catalog = path.join(docsRoot, 'architecture/03-business-process')
  if (fs.existsSync(catalog)) {
    for (const n of fs.readdirSync(catalog)) {
      if (!n.startsWith('FLOW-') || !n.endsWith('.md')) continue
      const meta = flowMetaFromFile(docsRoot, path.join(catalog, n))
      byId.set(meta.id, meta)
    }
  }
  const surfaces = path.join(docsRoot, 'product/surfaces')
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith('.') || ent.name === 'node_modules') continue
      const p = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        if (ent.name === 'processes' && path.basename(dir) === 'common') {
          for (const n of fs.readdirSync(p)) {
            if (!n.startsWith('FLOW-') || !n.endsWith('.md')) continue
            const meta = flowMetaFromFile(docsRoot, path.join(p, n))
            if (!byId.has(meta.id)) byId.set(meta.id, meta)
          }
        }
        walk(p)
      }
    }
  }
  walk(surfaces)
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))
}


/** Expected on-disk path for kinds that have a file/folder SSOT. */
export function expectedCanonicalPath(docsRoot: string, id: string): string | null {
  const kind = kindOf(id)
  if (kind === 'FLOW') {
    const catalog = path.join(docsRoot, 'architecture/03-business-process', `${id}.md`)
    if (fs.existsSync(catalog)) return catalog
    const listed = listFlowProcessFiles(docsRoot).find((p) => p.id === id)
    return listed ? path.join(docsRoot, listed.file) : catalog
  }
  if (kind === 'ADR') {
    const dir = path.join(docsRoot, 'architecture/09-decisions')
    if (!fs.existsSync(dir)) return null
    const prefix = id.match(/^(ADR-\d+)/)?.[1] ?? id
    const hit = fs.readdirSync(dir).find((n) => n.startsWith(prefix) && n.endsWith('.md'))
    return hit ? path.join(dir, hit) : path.join(dir, `${id}.md`)
  }
  if (kind === 'CMP') {
    return null // Too expensive to find canonical CMP here since it's nested deep in surfaces
  }
  if (kind === 'W' || kind === 'API' || kind === 'UI') {
    // Prefer folder under product/surfaces/**/code/<id>/
    const hits: string[] = []
    const walkCode = (dir: string) => {
      if (!fs.existsSync(dir)) return
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.name.startsWith('.') || ent.name === 'node_modules') continue
        const p = path.join(dir, ent.name)
        if (ent.isDirectory()) {
          if (ent.name === id) hits.push(path.join(p, 'index.md'))
          else walkCode(p)
        }
      }
    }
    walkCode(path.join(docsRoot, 'product'))
    walkCode(path.join(docsRoot, 'product/surfaces'))
    return hits[0] ?? null
  }
  // DEP lives as a heading inside chapter index — return chapter file
  const chapter = CANONICAL_DIR[kind]
  if (chapter) return path.join(docsRoot, chapter, 'index.md')
  return null
}
