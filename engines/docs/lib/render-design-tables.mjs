import { renderTable, MD_NONE } from './markdown-table.mjs'

function hasTreeContent(nodes = []) {
  if (!Array.isArray(nodes) || !nodes.length) return false
  return nodes.some(
    (n) =>
      (Array.isArray(n.items) && n.items.length) ||
      (Array.isArray(n.sections) && n.sections.length) ||
      n.kind ||
      n.visual
  )
}

function formatRecord(obj) {
  if (obj == null || obj === '') return ''
  if (typeof obj !== 'object') return String(obj)
  if (Array.isArray(obj)) return obj.map((v) => formatRecord(v)).filter(Boolean).join(', ')
  return Object.entries(obj)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}: ${formatRecord(v)}`)
    .join('; ')
}

function formatVisual(visual) {
  return formatRecord(visual)
}

function formatTags(node) {
  const tags = Array.isArray(node.tags) ? [...node.tags] : []
  if (node.extract) tags.push(`extract:${node.extract}`)
  return tags.filter(Boolean).join(', ')
}

function formatCopy(copy, item = {}) {
  if (copy && typeof copy === 'string') return copy
  if (!copy || typeof copy !== 'object') {
    const bits = [item.placeholder, item.helpText].filter(Boolean)
    return bits.length ? bits.join('; ') : ''
  }
  const bits = []
  if (copy.placeholder) bits.push(`placeholder: ${copy.placeholder}`)
  if (copy.helper) bits.push(`helper: ${copy.helper}`)
  if (copy.empty) bits.push(`empty: ${copy.empty}`)
  if (copy.toast) bits.push(`toast: ${copy.toast}`)
  if (copy.label) bits.push(`label: ${copy.label}`)
  return bits.length ? bits.join('; ') : ''
}

function formatStates(states) {
  if (!states || typeof states !== 'object') return ''
  const bits = []
  if (states.visibleWhen) bits.push(`hiện khi: ${states.visibleWhen}`)
  if (states.disabledWhen) bits.push(`khóa khi: ${states.disabledWhen}`)
  if (states.hiddenWhen) bits.push(`ẩn khi: ${states.hiddenWhen}`)
  if (states.loadingWhen) bits.push(`loading khi: ${states.loadingWhen}`)
  return bits.length ? bits.join('; ') : ''
}

function formatBind(bind) {
  if (!bind || typeof bind !== 'object') return ''
  return formatRecord(bind)
}

function formatValidation(validation, messages) {
  if (!validation) return []
  if (typeof validation !== 'object' || Array.isArray(validation)) {
    return [formatRecord(validation)]
  }
  const lines = []
  for (const [key, val] of Object.entries(validation)) {
    let msg = ''
    if (messages && messages[key]) {
      msg = ` ==> ${messages[key]}`
    }
    lines.push(`${key}: ${formatRecord(val)}${msg}`)
  }
  return lines
}

function renderItemBusiness(item, indent) {
  const pad = '  '.repeat(indent)
  const kind = item.kind || ''
  const title = item.name || item.label || item.value || item.id || 'item'
  const idStr = item.id ? ` \`${item.id}\`` : ''
  const lines = [`${pad}- **${title}**${idStr}${kind ? ` (\`${kind}\`)` : ''}`]
  
  lines.push(`${pad}  - Việc làm / ý nghĩa: ${item.purpose || '#missing_info'}`)
  
  const copyStr = formatCopy(item.copy, item)
  if (copyStr) lines.push(`${pad}  - Copy trên UI: ${copyStr}`)
  
  if (item.position) lines.push(`${pad}  - Vị trí: ${typeof item.position === 'string' ? item.position : formatRecord(item.position)}`)
  if (item.color || item.variant) {
    lines.push(`${pad}  - Màu / variant: ${[item.variant, item.color].filter(Boolean).join(' · ')}`)
  }
  const visual = formatVisual(item.visual)
  if (visual) lines.push(`${pad}  - Kích thước / CSS: ${visual}`)
  const interaction = formatRecord(item.interaction)
  if (interaction) lines.push(`${pad}  - Hover / blur / focus: ${interaction}`)
  
  const valLines = formatValidation(item.validation, item.messages)
  if (valLines.length === 1) {
    lines.push(`${pad}  - Validate (mặt UI): ${valLines[0]}`)
  } else if (valLines.length > 1) {
    lines.push(`${pad}  - Validate (mặt UI):`)
    valLines.forEach(l => lines.push(`${pad}    - ${l}`))
  }
  
  const statesStr = formatStates(item.states)
  if (statesStr) lines.push(`${pad}  - Hiện / ẩn / khóa: ${statesStr}`)
  
  if (item.actions) {
    const actionsStr = formatRecord(item.actions)
    if (actionsStr) lines.push(`${pad}  - Actions: ${actionsStr}`)
  }
  
  if (item.hidden === true) lines.push(`${pad}  - Ẩn trên UI (hidden)`)
  return lines
}

function renderItemTech(item, indent) {
  const pad = '  '.repeat(indent)
  const meta = [item.kind, item.widget].filter(Boolean).join(' / ')
  const lines = [`${pad}- **${item.id || item.name || item.label || item.value || 'item'}**${meta ? ` (\`${meta}\`)` : ''}`]
  const tags = formatTags(item)
  if (tags) lines.push(`${pad}  - tags: ${tags}`)
  if (item.extract) lines.push(`${pad}  - extract: ${item.extract}`)
  const bind = formatBind(item.bind)
  if (bind) lines.push(`${pad}  - bind / hidden field: ${bind}`)
  const apis = Array.isArray(item.apiRefs) ? item.apiRefs.join(', ') : item.bind?.apiRef
  if (apis) lines.push(`${pad}  - API: ${apis}`)
  if (item.hidden === true || item.bind?.hidden === true) lines.push(`${pad}  - hidden: true`)
  
  const valLines = formatValidation(item.validation, item.messages)
  if (valLines.length === 1) {
    lines.push(`${pad}  - validation: ${valLines[0]}`)
  } else if (valLines.length > 1) {
    lines.push(`${pad}  - validation:`)
    valLines.forEach(l => lines.push(`${pad}    - ${l}`))
  }
  
  if (item.testId) lines.push(`${pad}  - testId: ${item.testId}`)
  const st = formatStates(item.states)
  if (st) lines.push(`${pad}  - states: ${st}`)
  
  if (item.actions) {
    const actionsStr = formatRecord(item.actions)
    if (actionsStr) lines.push(`${pad}  - actions: ${actionsStr}`)
  }
  
  return lines
}

function renderSectionBusiness(section, depth) {
  const pad = '  '.repeat(depth)
  const kind = section.kind || 'section'
  const lines = [`${pad}- **${section.name || section.label || section.value || section.id || 'section'}** (\`${kind}\`)`]
  if (section.purpose) lines.push(`${pad}  - Việc làm / ý nghĩa: ${section.purpose}`)
  if (section.position) {
    lines.push(`${pad}  - Vị trí: ${typeof section.position === 'string' ? section.position : formatRecord(section.position)}`)
  }
  const visual = formatVisual(section.visual)
  if (visual) lines.push(`${pad}  - Kích thước / CSS: ${visual}`)
  const interaction = formatRecord(section.interaction)
  if (interaction) lines.push(`${pad}  - Hover / blur / focus: ${interaction}`)
  const val = formatValidation(section.validation)
  if (val) lines.push(`${pad}  - Validate (mặt UI): ${val}`)
  if (section.hidden === true) lines.push(`${pad}  - Ẩn trên UI`)
  for (const item of section.items || []) lines.push(...renderItemBusiness(item, depth + 1))
  for (const child of section.sections || []) lines.push(...renderSectionBusiness(child, depth + 1))
  return lines
}

function renderSectionTech(section, depth) {
  const pad = '  '.repeat(depth)
  const kind = section.kind || 'section'
  const lines = [`${pad}- **${section.id || section.name || section.label || section.value || 'section'}** (\`${kind}\`)`]
  const tags = formatTags(section)
  if (tags) lines.push(`${pad}  - tags: ${tags}`)
  if (section.extract) lines.push(`${pad}  - extract: ${section.extract}`)
  const apis = Array.isArray(section.apiRefs) ? section.apiRefs.join(', ') : ''
  if (apis) lines.push(`${pad}  - API: ${apis}`)
  if (section.hidden === true) lines.push(`${pad}  - hidden: true`)
  const visual = formatVisual(section.visual)
  if (visual) lines.push(`${pad}  - css: ${visual}`)
  const interaction = formatRecord(section.interaction)
  if (interaction) lines.push(`${pad}  - interaction: ${interaction}`)
  for (const item of section.items || []) lines.push(...renderItemTech(item, depth + 1))
  for (const child of section.sections || []) lines.push(...renderSectionTech(child, depth + 1))
  return lines
}

function renderNavTree(nodes, indent = 0) {
  const lines = []
  for (const node of nodes || []) {
    const pad = '  '.repeat(indent)
    const mark = node.active ? ' ← đang mở' : ''
    lines.push(`${pad}- ${node.name || node.label || node.value || node.id || 'node'}${mark}`)
    if (node.children?.length) lines.push(...renderNavTree(node.children, indent + 1))
  }
  return lines
}

export function renderNavMarkdown(nav = {}) {
  if (!nav || typeof nav !== 'object') return ''
  const parts = []
  const sidebar = nav.sidebar
  if (sidebar && sidebar.enabled !== false && (sidebar.levels?.length || sidebar.purpose)) {
    parts.push('### Menu trái (sidebar)', '')
    if (sidebar.purpose) parts.push(sidebar.purpose, '')
    parts.push(...renderNavTree(sidebar.levels || []), '')
  }
  const crumbs = nav.breadcrumb
  if (Array.isArray(crumbs) && crumbs.length) {
    const trail = crumbs.map((c) => (typeof c === 'string' ? c : c.name || c.label || c.value || c.href || '')).join(' > ')
    parts.push('### Breadcrumb', '', trail, '')
  }
  return parts.join('\n')
}

/**
 * Split-facing MD. `businessOnly` = ir/spec.yaml (no codegen/id/tag dump).
 * @param {Record<string, unknown>} design
 * @param {{ businessOnly?: boolean }} [opts]
 */
export function renderPageComposition(design = {}, opts = {}) {
  const tree =
    Array.isArray(design.sections) && design.sections.length
      ? design.sections
      : design.zones || []
  const navMd = renderNavMarkdown(design.nav)
  if (!navMd && !hasTreeContent(tree) && !(design.actions || []).length && !design.behavior) {
    return ''
  }

  const parts = [
    '## Bề mặt UI (BA / QA / stakeholder)',
    '',
    'Mô tả nghiệp vụ: nhãn, ý nghĩa, validate, hành động. Không gồm id kỹ thuật / hashtag component.',
    ''
  ]
  if (navMd) parts.push(navMd.trim(), '')
  if (hasTreeContent(tree)) {
    for (const node of tree) parts.push(...renderSectionBusiness(node, 0), '')
  }
  if (design.behavior && Object.keys(design.behavior).length) {
    parts.push('### Hành vi trang', '', renderBehaviorTable(design.behavior), '')
  }
  if (Array.isArray(design.actions) && design.actions.length) {
    parts.push('### Hành động', '', renderActionsBusiness(design.actions), '')
  }

  if (!opts.businessOnly) {
    parts.push(
      '## Kỹ thuật (Codegenkit / FE)',
      '',
      'Chỉ nằm trên `ir/design.yaml`. VitePress đọc `ir/spec.yaml`.',
      ''
    )
    if (hasTreeContent(tree)) {
      for (const node of tree) parts.push(...renderSectionTech(node, 0), '')
    }
  }
  return `${parts.join('\n').trim()}\n`
}

function renderActionsBusiness(actions = []) {
  const lines = []
  for (const action of actions) {
    const title = action.name || action.label || action.value || action.purpose || action.id || 'Hành động'
    lines.push(`- **${title}**`)
    if (action.purpose) lines.push(`  - Ý nghĩa: ${action.purpose}`)
    if (action.position) lines.push(`  - Vị trí: ${action.position}`)
    if (action.onSuccess) lines.push(`  - Khi thành công: ${formatRecord(action.onSuccess)}`)
    if (action.onCommonError) lines.push(`  - Lỗi chung: ${formatRecord(action.onCommonError)}`)
    if (action.onSpecificError) lines.push(`  - Lỗi cụ thể: ${formatRecord(action.onSpecificError)}`)
  }
  return lines.join('\n') || MD_NONE
}

export function renderZoneItemsBusiness(zones = []) {
  return renderPageComposition({ zones }, { businessOnly: true })
}

export function renderZonesTable(zones = []) {
  if (!zones.length) return MD_NONE

  return renderTable(
    ['ID', 'Nhãn', 'Kind', 'Visual', 'Tags'],
    zones.map((zone) => [
      zone.id ?? '',
      zone.label ?? zone.title ?? '',
      zone.kind ?? '',
      formatVisual(zone.visual),
      formatTags(zone)
    ])
  )
}

function collectItemRows(nodes, parentId, rows) {
  for (const node of nodes || []) {
    const sid = node.id ?? parentId
    for (const item of node.items || []) {
      const apis = Array.isArray(item.apiRefs)
        ? item.apiRefs.join(', ')
        : item.bind?.apiRef || ''
      rows.push([
        sid ?? '',
        item.id ?? '',
        item.kind ?? '',
        item.widget ?? '',
        formatBind(item.bind),
        apis,
        item.hidden === true || item.bind?.hidden === true ? 'yes' : '',
        formatValidation(item.validation, item.messages),
        formatTags(item)
      ])
    }
    collectItemRows(node.sections, sid, rows)
  }
}

export function renderZoneItemsTechTable(zones = []) {
  const rows = []
  collectItemRows(zones, '', rows)
  if (!rows.length) return MD_NONE
  return renderTable(
    ['Zone', 'ID', 'Kind', 'Widget', 'Bind / hidden field', 'API', 'Hidden', 'Validation', 'Tags'],
    rows
  )
}

export function renderBehaviorTable(behavior = {}) {
  const verbs = ['create', 'update', 'delete', 'duplicate', 'export', 'import']
  const rows = []

  for (const verb of verbs) {
    const block = behavior[verb]
    if (!block || typeof block !== 'object') continue
    rows.push([
      verb,
      block.enabled === false ? 'không' : 'có',
      block.surface ?? block.mode ?? block.target ?? '',
      block.confirm ?? (block.mode && block.surface ? block.mode : '') ?? '',
      block.notes ?? ''
    ])
  }

  if (!rows.length) return MD_NONE

  return renderTable(['Hành động', 'Bật', 'Surface / mode', 'Confirm', 'Ghi chú'], rows)
}

export function renderActionsTable(actions = []) {
  if (!actions.length) return MD_NONE

  return renderTable(
    ['ID', 'Label', 'Variant', 'Position', 'Trigger', 'API'],
    actions.map((action) => [
      action.id ?? '',
      action.label ?? action.text ?? '',
      action.variant ?? action.type ?? '',
      action.position ?? '',
      action.trigger ?? '',
      formatApi(action)
    ])
  )
}

function formatApi(action) {
  const tags = Array.isArray(action.tags) ? action.tags.map(String) : []
  const reuse = action.reuseFrom || tags.find((t) => t.startsWith('#reuse-api'))
  if (reuse) return String(action.reuseFrom || reuse)
  if (action.api) return String(action.api)
  if (Array.isArray(action.apiRefs)) return action.apiRefs.join(', ')
  return ''
}