function tagList(node) {
  const raw = node?.tags
  if (!raw) return []
  return (Array.isArray(raw) ? raw : [raw]).map((t) => String(t))
}

function isReuseTag(tag) {
  return tag === '#reuse-api' || tag.startsWith('#reuse-api:')
}

function reusePathFromTags(tags) {
  for (const tag of tags) {
    if (tag.startsWith('#reuse-api:')) {
      const path = tag.slice('#reuse-api:'.length).trim()
      if (path) return path
    }
  }
  return undefined
}

function apiRefsOf(node) {
  if (Array.isArray(node.apiRefs) && node.apiRefs.length) return node.apiRefs
  if (node.bind?.apiRef) return [node.bind.apiRef]
  return []
}

function hasApiCall(node, tags) {
  if (!node || typeof node !== 'object') return false
  if (tags.some(isReuseTag)) return true
  if (node.reuseFrom) return true
  if (apiRefsOf(node).length) return true
  return false
}

function walk(node, loc, out) {
  if (!node || typeof node !== 'object') return
  const tags = tagList(node)
  if (hasApiCall(node, tags)) {
    const reuse = tags.some(isReuseTag) || Boolean(node.reuseFrom)
    out.push({
      id: node.id ?? null,
      label: node.label ?? null,
      kind: node.kind ?? null,
      loc,
      reuse,
      reuseFrom: node.reuseFrom || reusePathFromTags(tags) || null,
      apiRefs: apiRefsOf(node),
    })
  }
  for (const item of node.items || []) walk(item, loc, out)
  for (const sec of node.sections || []) walk(sec, loc, out)
}

/**
 * Screen API inventory from ir/design.yaml (page actions + nested items).
 * `#reuse-api` / reuseFrom = pointer only (no new trio on this leaf).
 * Other apiRefs = unique APIs this screen still needs a sibling api/<seq>/.
 */
export function collectScreenApiIntents(design = {}) {
  const out = []
  for (const action of design.actions || []) walk(action, 'actions', out)
  for (const section of design.sections || []) walk(section, 'sections', out)
  for (const zone of design.zones || []) walk(zone, 'zones', out)
  return out
}

export function screenNeedsLocalApiTrio(design = {}) {
  return collectScreenApiIntents(design).some((row) => !row.reuse)
}
