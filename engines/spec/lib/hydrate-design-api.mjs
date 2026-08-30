import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

function isSeqDir(name) {
  return /^\d{2,}$/.test(name)
}

/** `…/<leaf>/api/<seq>/01-backend-spec.yaml` next to the feature bundle. */
export function listSiblingBackend01(bundleDir) {
  const apiRoot = path.join(path.resolve(bundleDir), 'api')
  if (!existsSync(apiRoot)) return []
  const out = []
  for (const name of readdirSync(apiRoot, { withFileTypes: true })) {
    if (!name.isDirectory() || !isSeqDir(name.name)) continue
    const file = path.join(apiRoot, name.name, '01-backend-spec.yaml')
    if (existsSync(file)) out.push(file)
  }
  out.sort()
  return out
}

function slimEndpoint(ep = {}) {
  const row = {}
  if (ep.id != null) row.id = ep.id
  if (ep.method != null) row.method = ep.method
  if (ep.path != null) row.path = ep.path
  if (ep.action != null) row.action = ep.action
  return row
}

/**
 * Authoring SSOT is 01 only. ir/design.yaml.api is a split projection of **local** sibling 01 files.
 * Reused APIs are not projected here — they stay on design.actions/items (`#reuse-api` + reuseFrom).
 */
export function projectDesignApiFrom01(bundleDir) {
  const endpoints = []
  for (const file of listSiblingBackend01(bundleDir)) {
    let spec = {}
    try {
      spec = parse(readFileSync(file, 'utf8')) ?? {}
    } catch {
      continue
    }
    for (const ep of spec.api?.endpoints ?? []) {
      endpoints.push(slimEndpoint(ep))
    }
  }
  if (!endpoints.length) return null
  return { endpoints }
}

export function applyDesignApiFrom01(design, bundleDir) {
  const projected = projectDesignApiFrom01(bundleDir)
  if (projected) design.api = projected
  else delete design.api
  return design
}
