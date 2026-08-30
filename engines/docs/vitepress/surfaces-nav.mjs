import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

export const SKIP_NAV_DIRS = new Set([
  'code',
  'ir',
  'node_modules',
  '.git',
  'api',
  'generated',
  'handoff',
  'dist',
  'cache',
  'registries',
  '.cursor',
])

function extractLabeledCode(content, label) {
  if (!content) return null
  const m =
    content.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*\`?([A-Za-z0-9._-]+)\`?`)) ||
    content.match(new RegExp(`${label}:\\s*\`?([A-Za-z0-9._-]+)\`?`))
  return m ? m[1] : null
}

export function extractDocCode(content) {
  return extractLabeledCode(content, 'Mã tài liệu')
}

export function extractProcessCode(content) {
  return extractLabeledCode(content, 'Mã quy trình')
}

/** Short sidebar/catalog label. Null = caller may fall back to H1. */
export function markdownNavText(fileName, content) {
  const stem = String(fileName || '').replace(/\.md$/i, '')
  if (/^db-erd$/i.test(stem)) return 'db-erd'
  const processCode = extractProcessCode(content)
  if (/^FLOW-/i.test(stem) || processCode) return processCode || stem
  if (/^CMP-/i.test(stem)) return extractDocCode(content) || stem
  return null
}

export function shouldListSurfacesMarkdown(fileName, content) {
  const stem = String(fileName || '').replace(/\.md$/i, '')
  if (/^CMP-/i.test(stem) || /^db-erd$/i.test(stem) || /^FLOW-/i.test(stem)) return true
  return Boolean(extractProcessCode(content))
}

function yamlScalar(text, key) {
  const re = new RegExp(`^${key}:\\s*(.+)$`, 'm')
  const m = text.match(re)
  if (!m) return null
  return m[1].trim().replace(/^['"]|['"]$/g, '')
}

export function pageIdFromYamlText(text) {
  return yamlScalar(text, 'page-id') || yamlScalar(text, 'id') || null
}

function listDir(dir) {
  if (!existsSync(dir)) return []
  try {
    return readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

function readText(file) {
  try {
    return readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

export function isNumericSeq(name) {
  return /^\d{2,}$/.test(name)
}

export function isFunctionLeaf(dir) {
  const hasBundle = listDir(dir).some((e) => e.isFile() && /\.bundle\.ya?ml$/i.test(e.name))
  return hasBundle || existsSync(path.join(dir, 'ir', 'spec.yaml'))
}

export function pageIdFromLeaf(dir) {
  const specFile = path.join(dir, 'ir', 'spec.yaml')
  if (existsSync(specFile)) {
    const id = pageIdFromYamlText(readText(specFile))
    if (id) return id
  }
  for (const ent of listDir(dir)) {
    if (!ent.isFile() || !/\.bundle\.ya?ml$/i.test(ent.name)) continue
    const id = pageIdFromYamlText(readText(path.join(dir, ent.name)))
    if (id) return id
  }
  return path.basename(dir)
}

/**
 * @param {string} dir
 * @param {(absPath: string) => string | undefined} toHref
 */
export function walkSurfacesNav(dir, toHref) {
  const children = []
  const entries = listDir(dir).sort((a, b) => a.name.localeCompare(b.name, 'en'))

  for (const ent of entries) {
    if (!ent.isFile() || !ent.name.endsWith('.md')) continue
    if (ent.name === 'index.md' || ent.name === 'CATALOG.md') continue
    const full = path.join(dir, ent.name)
    const body = readText(full)
    if (!shouldListSurfacesMarkdown(ent.name, body)) continue
    const href = toHref(full)
    children.push({
      text: markdownNavText(ent.name, body) || ent.name.replace(/\.md$/, ''),
      href,
      link: href,
    })
  }

  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    if (SKIP_NAV_DIRS.has(ent.name)) continue
    const full = path.join(dir, ent.name)
    if (isNumericSeq(ent.name) && isFunctionLeaf(full)) {
      const pageId = pageIdFromLeaf(full)
      const specMd = path.join(full, 'ir', 'generated', 'spec.md')
      const href = toHref(specMd)
      children.push({
        text: `${ent.name} + ${pageId}`,
        href,
        link: href,
      })
      continue
    }
    const nested = walkSurfacesNav(full, toHref)
    const index = path.join(full, 'index.md')
    const hasIndex = existsSync(index)
    if (!nested.length && !hasIndex) continue
    const href = hasIndex ? toHref(index) : undefined
    children.push({
      text: /^db-erd$/i.test(ent.name) ? 'db-erd' : ent.name,
      href,
      link: href,
      children: nested.length ? nested : undefined,
      items: nested.length ? nested : undefined,
    })
  }

  return children
}

export function vitepressHref(surfacesDir, urlPrefix, filePath) {
  const rel = path.relative(surfacesDir, filePath).split(path.sep).join('/')
  return `${urlPrefix}${rel.replace(/\.md$/, '')}`
}

export function buildSurfacesSidebarItems(surfacesDir, urlPrefix) {
  const items = walkSurfacesNav(surfacesDir, (abs) => vitepressHref(surfacesDir, urlPrefix, abs))
  return items.map(toVitepressItem)
}

function toVitepressItem(node) {
  const item = { text: node.text }
  if (node.link) item.link = node.link
  if (node.items?.length) {
    item.items = node.items.map(toVitepressItem)
    item.collapsed = true
  }
  return item
}
