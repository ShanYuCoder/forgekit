import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

export const QA_LIST_FILE = 'qa/index.md'

function listOpenYaml(openDir) {
  if (!existsSync(openDir)) return []
  return readdirSync(openDir)
    .filter((n) => /^QA-.*\.ya?ml$/i.test(n))
    .sort()
}

function oneLine(text) {
  if (!text) return ''
  return String(text).trim().split(/\n/)[0].trim()
}

/**
 * Always write qa/index.md (empty body when no qa/open files).
 */
export function writeQaList(root = process.cwd()) {
  const hub = path.resolve(root)
  const qaDir = path.join(hub, 'qa')
  const openDir = path.join(qaDir, 'open')
  mkdirSync(qaDir, { recursive: true })

  const lines = ['# QA', '', '_Sinh bởi `docskit render`. Đóng bằng `/qa-resolve`._', '']
  const files = listOpenYaml(openDir)
  if (!files.length) {
    lines.push('_Không có câu hỏi mở._', '')
  } else {
    for (const name of files) {
      const full = path.join(openDir, name)
      let id = name.replace(/\.ya?ml$/i, '')
      let kind = ''
      let question = ''
      try {
        const doc = parse(readFileSync(full, 'utf8')) ?? {}
        if (doc.id) id = String(doc.id)
        if (doc.kind) kind = String(doc.kind)
        question = oneLine(doc.question)
      } catch {
        /* list the file anyway */
      }
      const bits = [`[${id}](open/${name})`]
      if (kind) bits.push(kind)
      if (question) bits.push(question)
      lines.push(`- ${bits.join(' — ')}`)
    }
    lines.push('')
  }

  const out = path.join(hub, ...QA_LIST_FILE.split('/'))
  writeFileSync(out, lines.join('\n'))
  return out
}
