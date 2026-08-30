import { stringify } from 'yaml'

/** Team convention: `#` trong code = chưa có link / chưa có nội dung. */
export const MD_NONE = '`#`'

/** VitePress treats `{...}` in headings as custom id attributes. */
export function escapeMarkdownHeading(text) {
  return String(text).replace(/\{/g, '\\{').replace(/\}/g, '\\}')
}

export function escapeCell(value) {
  if (value == null || value === '') return ''
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}

export function renderTable(headers, rows) {
  if (!rows.length) return MD_NONE

  const head = `| ${headers.join(' | ')} |`
  const sep = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`).join('\n')

  return `${head}\n${sep}\n${body}`
}

export function objectRows(items = [], columns) {
  return items.map((item) => {
    if (typeof item === 'string') return [item]
    return columns.map((col) => formatCellValue(item[col.key], col))
  })
}

export function formatCellValue(value, column) {
  if (column?.format) return column.format(value)
  if (value == null) return ''
  if (Array.isArray(value)) return value.map((v) => formatInline(v)).join(', ')
  if (typeof value === 'object') return formatInline(value)
  return String(value)
}

export function formatInline(value) {
  if (typeof value === 'string') return value
  if (value == null) return ''
  return `\`${JSON.stringify(value)}\``
}

export function renderBullets(items = []) {
  if (!items.length) return MD_NONE

  return items.map((item) => {
    if (typeof item === 'string') return `- ${item}`
    if (item && typeof item === 'object') {
      const entries = Object.entries(item)
      if (entries.length === 1) return `- ${entries[0][0]}: ${entries[0][1]}`
      return `- \n\`\`\`yaml\n${stringify(item).trim()}\n\`\`\``
    }
    return `- ${formatInline(item)}`
  }).join('\n')
}

export function renderNumberedList(items = []) {
  return items.length
    ? items.map((item, index) => `${index + 1}. ${formatInline(item)}`).join('\n')
    : MD_NONE
}
