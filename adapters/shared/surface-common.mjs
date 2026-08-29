import path from 'node:path'

function normalize(filePath) {
  return String(filePath ?? '').split(path.sep).join('/')
}

/**
 * Docs-hub common trees that must not be page-gen'd:
 * - platform:  product/surfaces/common/
 * - surface:   product/surfaces/<surface>/common/
 * - module:    product/surfaces/<surface>/CMP-…/common/
 */
export function isDocsCommonPath(filePath) {
  const n = normalize(filePath)
  return /(?:^|\/)product\/surfaces\/(?:common|(?:[^/]+\/(?:CMP-[^/]+\/)?common))(?:\/|$)/.test(n)
}

/** @deprecated alias — covers platform, surface, and module common */
export function isSurfaceCommonPath(filePath) {
  return isDocsCommonPath(filePath)
}

export function docsCommonScope(filePath) {
  const n = normalize(filePath)
  const moduleMatch = n.match(/(?:^|\/)product\/surfaces\/([^/]+)\/(CMP-[^/]+)\/common(?:\/|$)/)
  if (moduleMatch) {
    return { scope: 'module', surface: moduleMatch[1], module: moduleMatch[2] }
  }
  const surfaceMatch = n.match(/(?:^|\/)product\/surfaces\/([^/]+)\/common(?:\/|$)/)
  if (surfaceMatch) {
    return { scope: 'surface', surface: surfaceMatch[1], module: null }
  }
  if (/(?:^|\/)product\/surfaces\/common(?:\/|$)/.test(n)) {
    return { scope: 'surface', surface: 'common', module: null }
  }
  return null
}

export function surfaceCommonDirName(filePath) {
  return docsCommonScope(filePath)?.surface ?? null
}
