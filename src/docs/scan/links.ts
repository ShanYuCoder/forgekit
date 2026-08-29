import fs from 'node:fs'
import path from 'node:path'
import { extractIdsFromText, type HubId } from './ids.js'

const MD_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g

export type LinkHit = {
  file: string
  href: string
  ok: boolean
  reason?: string
}

export function validateMdLinks(docsRoot: string, files: string[]): LinkHit[] {
  const hits: LinkHit[] = []
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    const dir = path.dirname(file)
    for (const m of text.matchAll(MD_LINK_RE)) {
      let href = m[2].trim()
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
        continue
      }
      // strip hash/query
      const hash = href.indexOf('#')
      if (hash >= 0) href = href.slice(0, hash)
      if (!href) continue
      // VitePress absolute from site root
      let target: string
      if (href.startsWith('/')) {
        target = path.join(docsRoot, href.replace(/^\//, ''))
      } else {
        target = path.resolve(dir, href)
      }
      // try as file, as dir/index.md, as .md
      const ok = resolveExisting(target)
      hits.push({
        file,
        href: m[2].trim(),
        ok,
        reason: ok ? undefined : 'missing',
      })
    }
  }
  return hits.filter((h) => !h.ok)
}

function resolveExisting(target: string): boolean {
  if (fs.existsSync(target)) {
    const st = fs.statSync(target)
    if (st.isFile()) return true
    if (st.isDirectory()) {
      if (fs.existsSync(path.join(target, 'index.md'))) return true
      // non-empty dir (e.g. journeys/) counts as ok for folder links
      try {
        if (fs.readdirSync(target).length > 0) return true
      } catch {
        /* ignore */
      }
    }
  }
  if (fs.existsSync(target + '.md')) return true
  if (fs.existsSync(path.join(target, 'index.md'))) return true
  if (fs.existsSync(target.replace(/\/$/, '') + '.md')) return true
  return false
}

export function depsFromFiles(files: string[], selfId: string): string[] {
  const deps = new Set<string>()
  for (const f of files) {
    if (!fs.existsSync(f)) continue
    const text = fs.readFileSync(f, 'utf8')
    for (const id of extractIdsFromText(text)) {
      if (id !== selfId) deps.add(id)
    }
  }
  return [...deps].sort()
}

export function dependentsOf(id: string, index: Map<string, HubId>, docsRoot: string): string[] {
  const out: string[] = []
  for (const [other, meta] of index) {
    if (other === id) continue
    for (const f of meta.files) {
      const abs = path.isAbsolute(f) ? f : path.join(docsRoot, f)
      if (!fs.existsSync(abs)) continue
      const text = fs.readFileSync(abs, 'utf8')
      if (extractIdsFromText(text).has(id)) {
        out.push(other)
        break
      }
    }
  }
  return out.sort()
}
