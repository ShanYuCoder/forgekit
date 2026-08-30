import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * @param {string} routePath e.g. /hotels or /stores
 * @param {string} projectRoot
 */
export function hasPageForRoute(routePath, projectRoot) {
  return pageCandidatesForRoute(routePath).some((rel) => existsSync(join(projectRoot, rel)))
}

/**
 * Screen path cho docs: inline code (không markdown link tới dev app — VitePress dead-link check).
 * Page chưa có: `# /path`.
 * @param {string} routePath
 * @param {string} devBaseUrl
 * @param {string} projectRoot
 */
export function renderScreenLink(routePath, devBaseUrl, projectRoot) {
  const path = normalizeRoutePath(routePath)
  if (!path) return '`#`'

  const ready = hasPageForRoute(path, projectRoot)
  if (!ready) return `\`# ${path}\``

  const url = `${devBaseUrl.replace(/\/$/, '')}${path}`
  return `\`${path}\` (dev \`${url}\`)`
}

/** @param {string} routePath */
function normalizeRoutePath(routePath) {
  if (!routePath?.trim()) return ''
  const trimmed = routePath.trim()
  if (trimmed === '/') return '/'
  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`
}

/** @param {string} routePath */
function pageCandidatesForRoute(routePath) {
  const normalized = normalizeRoutePath(routePath)
  if (!normalized) return []

  if (normalized === '/') {
    return ['pages/index.vue']
  }

  const segments = normalized.split('/').filter(Boolean)
  const joined = segments.join('/')

  return [
    `pages/${joined}.vue`,
    `pages/${joined}/index.vue`
  ]
}
