import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { writeQaList } from './render-qa-list.mjs'
import { SKIP_NAV_DIRS, markdownNavText, walkSurfacesNav } from '../vitepress/surfaces-nav.mjs'

/** Hub roots included in GitHub CATALOG.md (VitePress still has architecture). */
const CATALOG_ROOTS = ['platform', 'product']

/** Skip these names when walking inside platform/ or product/. */
const SKIP_NEST = new Set(['node_modules', '.git', 'code', 'dist', 'cache', 'registries', '.cursor'])

const README_MARKER = '<!-- docskit-catalog -->'
const README_END = '<!-- /docskit-catalog -->'
const README_BLOCK = `${README_MARKER}
**[Danh mục tài liệu](CATALOG.md)**
${README_END}
`

function posixRel(root, file) {
  return path.relative(root, file).split(path.sep).join('/')
}

function mdTitle(file, fallback) {
  try {
    const text = readFileSync(file, 'utf8')
    const short = markdownNavText(path.basename(file), text)
    if (short) return short
    const m = text.match(/^#\s+(.+)$/m)
    if (m) return m[1].trim()
  } catch {
    /* ignore */
  }
  return fallback
}

function listDir(dir) {
  if (!existsSync(dir)) return []
  try {
    return readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

function walkTree(dir, root) {
  if (path.resolve(dir) === path.resolve(root, 'product', 'surfaces')) {
    return walkSurfacesNav(dir, (abs) => posixRel(root, abs)).map(function catalogize(n) {
      return {
        text: n.text,
        href: n.href,
        children: n.children?.length ? n.children.map(catalogize) : undefined,
      }
    })
  }
  const children = []
  const entries = listDir(dir).sort((a, b) => a.name.localeCompare(b.name))
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === 'ir') {
        const specMd = path.join(full, 'generated', 'spec.md')
        if (existsSync(specMd)) {
          children.push({
            text: 'spec',
            href: posixRel(root, specMd),
          })
        }
        continue
      }
      if (SKIP_NEST.has(ent.name) || SKIP_NAV_DIRS.has(ent.name)) continue
      const nested = walkTree(full, root)
      const index = path.join(full, 'index.md')
      const hasIndex = existsSync(index)
      if (!nested.length && !hasIndex) continue
      children.push({
        text: /^db-erd$/i.test(ent.name) ? 'db-erd' : hasIndex ? mdTitle(index, ent.name) : ent.name,
        href: hasIndex ? posixRel(root, index) : undefined,
        children: nested,
      })
      continue
    }
    if (!ent.isFile() || !ent.name.endsWith('.md')) continue
    if (ent.name === 'index.md' || ent.name === 'CATALOG.md') continue
    children.push({
      text: mdTitle(full, ent.name.replace(/\.md$/, '')),
      href: posixRel(root, full),
    })
  }
  return children
}

function renderTree(nodes, depth = 0) {
  const pad = '  '.repeat(depth)
  const lines = []
  for (const node of nodes || []) {
    const label = node.href ? `[${node.text}](${node.href})` : node.text
    lines.push(`${pad}- ${label}`)
    if (node.children?.length) lines.push(...renderTree(node.children, depth + 1))
  }
  return lines
}

export function writeGithubCatalog(root = process.cwd()) {
  const hub = path.resolve(root)
  mkdirSync(hub, { recursive: true })
  writeQaList(hub)

  const lines = [
    '# Danh mục tài liệu',
    '',
    '_Sinh bởi `docskit publish`. Click link để mở trang Markdown. Không sửa tay._',
    '',
  ]

  for (const name of CATALOG_ROOTS) {
    const dir = path.join(hub, name)
    const children = walkTree(dir, hub)
    if (!children.length) continue
    const index = path.join(dir, 'index.md')
    const href = existsSync(index) ? posixRel(hub, index) : undefined
    lines.push(...renderTree([{ text: cap(name), href, children }]), '')
  }

  lines.push(...renderTree([{ text: 'QA', children: [{ text: 'Danh sách QA', href: 'qa/index.md' }] }]), '')

  const catalogPath = path.join(hub, 'CATALOG.md')
  writeFileSync(catalogPath, `${lines.join('\n').trim()}\n`)
  ensureReadmeCatalogLink(hub)
  return catalogPath
}

function cap(name) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function ensureReadmeCatalogLink(root) {
  const readme = path.join(root, 'README.md')
  const existing = existsSync(readme) ? readFileSync(readme, 'utf8') : '# Docs\n'
  const rest = stripCatalogBlock(existing).replace(/^\s+/, '')
  writeFileSync(readme, `${README_BLOCK}\n${rest}`.replace(/\n+$/, '\n'))
}

function stripCatalogBlock(text) {
  const paired = /<!-- docskit-catalog -->[\s\S]*?<!-- \/docskit-catalog -->\n*/
  if (paired.test(text)) return text.replace(paired, '')
  if (text.includes(README_MARKER)) {
    return (
      text.slice(0, text.indexOf(README_MARKER)) +
      text.slice(text.indexOf(README_MARKER)).replace(/^[\s\S]*?\n\n/, '')
    )
  }
  return text
}
