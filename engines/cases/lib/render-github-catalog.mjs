import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const CATALOG_ROOTS = ['cases', 'scenarios', 'plans']

const SKIP_NEST = new Set(['node_modules', '.git', 'code', 'dist', 'cache', 'registries', '.cursor'])

const README_MARKER = '<!-- testkit-catalog -->'
const README_END = '<!-- /testkit-catalog -->'
const README_BLOCK = `${README_MARKER}
**[Danh mục Testcase](CATALOG.md)**
${README_END}
`

function posixRel(root, file) {
  return path.relative(root, file).split(path.sep).join('/')
}

function mdTitle(file, fallback) {
  try {
    const text = readFileSync(file, 'utf8')
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
  const children = []
  const entries = listDir(dir).sort((a, b) => a.name.localeCompare(b.name))
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (SKIP_NEST.has(ent.name)) continue
      const nested = walkTree(full, root)
      const index = path.join(full, 'index.md')
      const hasIndex = existsSync(index)
      
      let title = ent.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      if (hasIndex) {
        const extracted = mdTitle(index, null)
        if (extracted) title = extracted
      }

      if (!nested.length && !hasIndex) continue
      children.push({
        text: title,
        href: hasIndex ? posixRel(root, index) : undefined,
        children: nested,
      })
      continue
    }
    if (ent.isFile() && ent.name.endsWith('.md') && ent.name !== 'index.md' && ent.name !== 'CATALOG.md') {
      const nameWithoutExt = ent.name.replace(/\.md$/, '')
      let title = nameWithoutExt
      if (!/^(TC|SC)-/i.test(nameWithoutExt)) {
        title = nameWithoutExt.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        const extracted = mdTitle(full, null)
        if (extracted) title = extracted
      }
      
      children.push({
        text: title,
        href: posixRel(root, full),
      })
    }
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

  const lines = [
    '# Danh mục Testcase & Scenario',
    '',
    '_Sinh bởi `testkit tests:publish`. Click link để mở tài liệu. Không sửa tay._',
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
  const existing = existsSync(readme) ? readFileSync(readme, 'utf8') : '# Test Hub\n'
  const rest = stripCatalogBlock(existing).replace(/^\s+/, '')
  writeFileSync(readme, `${README_BLOCK}\n${rest}`.replace(/\n+$/, '\n'))
}

function stripCatalogBlock(text) {
  const paired = /<!-- testkit-catalog -->[\s\S]*?<!-- \/testkit-catalog -->\n*/
  if (paired.test(text)) return text.replace(paired, '')
  if (text.includes(README_MARKER)) {
    return (
      text.slice(0, text.indexOf(README_MARKER)) +
      text.slice(text.indexOf(README_MARKER)).replace(/^[\s\S]*?\n\n/, '')
    )
  }
  return text
}
