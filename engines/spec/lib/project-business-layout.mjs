const TECH_KEYS = new Set([
  'id',
  'tags',
  'extract',
  'bind',
  'widget',
  'apiRefs',
  'reuseFrom',
  'hidden',
  'testId',
  'testIds',
  'i18n',
  'href',
  'active',
  'component',
])

const CSS_VISUAL = new Set([
  'width',
  'height',
  'maxWidth',
  'maxHeight',
  'padding',
  'borderRadius',
  'overflow',
  'scroll',
  'background',
])

const BUSINESS_SCALAR = [
  'kind',
  'label',
  'value',
  'purpose',
  'description',
  'copy',
  'position',
  'color',
  'variant',
  'interaction',
  'validation',
  'messages',
  'states',
  'i18n',
  'trigger',
]

function pruneEmpty(value) {
  if (value == null || value === '') return undefined
  if (Array.isArray(value)) {
    const next = value.map(pruneEmpty).filter((v) => v != null && v !== '')
    return next.length ? next : undefined
  }
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      const pv = pruneEmpty(v)
      if (pv != null && pv !== '') out[k] = pv
    }
    return Object.keys(out).length ? out : undefined
  }
  return value
}

function projectVisual(visual) {
  if (visual == null || typeof visual !== 'object' || Array.isArray(visual)) return pruneEmpty(visual)
  const out = {}
  for (const [k, v] of Object.entries(visual)) {
    if (CSS_VISUAL.has(k)) continue
    const pv = pruneEmpty(v)
    if (pv != null) out[k] = pv
  }
  return Object.keys(out).length ? out : undefined
}

function projectErrorNotes(block) {
  if (block == null) return undefined
  if (typeof block === 'string') return block
  if (Array.isArray(block)) {
    const notes = block
      .map((row) => {
        if (typeof row === 'string') return row
        if (row && typeof row === 'object') {
          const bits = [row.condition, row.notes].filter(Boolean)
          return bits.length ? bits.join(': ') : undefined
        }
        return undefined
      })
      .filter(Boolean)
    return notes.length ? notes : undefined
  }
  if (typeof block === 'object') {
    if (block.notes) return block.notes
    if (block.override === true) return pruneEmpty({ override: true, notes: block.notes })
  }
  return undefined
}

function projectNode(node) {
  if (!node || typeof node !== 'object') return undefined
  const out = {}
  for (const key of BUSINESS_SCALAR) {
    if (node[key] == null) continue
    const pv = key === 'visual' ? projectVisual(node.visual) : pruneEmpty(node[key])
    if (pv != null) out[key] = pv
  }
  const visual = projectVisual(node.visual)
  if (visual) out.visual = visual

  const items = (node.items || []).map(projectNode).filter(Boolean)
  if (items.length) out.items = items
  const sections = (node.sections || []).map(projectNode).filter(Boolean)
  if (sections.length) out.sections = sections

  const onSuccess = pruneEmpty(node.onSuccess)
  if (onSuccess) out.onSuccess = onSuccess
  const common = projectErrorNotes(node.onCommonError)
  if (common) out.onCommonError = common
  const specific = projectErrorNotes(node.onSpecificError)
  if (specific) out.onSpecificError = specific

  const actions = pruneEmpty(node.actions)
  if (actions) out.actions = actions

  return Object.keys(out).length ? out : undefined
}

function projectNavLevels(levels = []) {
  return levels
    .map((n) => {
      if (!n || typeof n !== 'object') return undefined
      const row = {}
      if (n.label) row.label = n.label
      if (n.purpose) row.purpose = n.purpose
      const children = projectNavLevels(n.children || [])
      if (children.length) row.children = children
      return Object.keys(row).length ? row : undefined
    })
    .filter(Boolean)
}

function projectNav(nav) {
  if (!nav || typeof nav !== 'object') return undefined
  const out = {}
  if (nav.sidebar && typeof nav.sidebar === 'object') {
    const sb = {}
    if (nav.sidebar.purpose) sb.purpose = nav.sidebar.purpose
    if (nav.sidebar.enabled === false) sb.enabled = false
    const levels = projectNavLevels(nav.sidebar.levels || [])
    if (levels.length) sb.levels = levels
    if (Object.keys(sb).length) out.sidebar = sb
  }
  if (Array.isArray(nav.breadcrumb) && nav.breadcrumb.length) {
    out.breadcrumb = nav.breadcrumb
      .map((c) => (typeof c === 'string' ? c : c?.label))
      .filter(Boolean)
  }
  return Object.keys(out).length ? out : undefined
}

function projectActions(actions = []) {
  return actions.map(projectNode).filter(Boolean)
}

function projectBehavior(behavior) {
  if (!behavior || typeof behavior !== 'object') return undefined
  const out = {}
  for (const [verb, block] of Object.entries(behavior)) {
    if (!block || typeof block !== 'object') continue
    const row = {}
    if (block.enabled === false) row.enabled = false
    else if (block.enabled === true) row.enabled = true
    if (block.surface) row.surface = block.surface
    if (block.mode) row.mode = block.mode
    if (block.notes) row.notes = block.notes
    if (Object.keys(row).length) out[verb] = row
  }
  return Object.keys(out).length ? out : undefined
}

/**
 * ir/spec.yaml layout: labels/purpose/validation/actions — no ids, tags, bind, components.
 */
export function projectBusinessPage(design = {}) {
  const page = {}
  const nav = projectNav(design.nav)
  if (nav) page.nav = nav
  const sections = (design.sections || []).map(projectNode).filter(Boolean)
  if (sections.length) page.sections = sections
  const zones = (design.zones || []).map(projectNode).filter(Boolean)
  if (zones.length) page.zones = zones
  const behavior = projectBehavior(design.behavior)
  if (behavior) page.behavior = behavior
  const actions = projectActions(design.actions || [])
  if (actions.length) page.actions = actions
  return page
}

export { TECH_KEYS }

export function isPlaceholderLegacy(legacy) {
  if (legacy == null) return true
  if (typeof legacy !== 'object' || Array.isArray(legacy)) return false
  const keys = Object.keys(legacy).filter((k) => k !== 'id')
  if (!keys.length) return true
  for (const key of keys) {
    const v = legacy[key]
    if (v == null || v === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    if (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length) continue
    return false
  }
  return true
}
