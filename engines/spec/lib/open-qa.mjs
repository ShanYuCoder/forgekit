import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

/** Walk up from a bundle dir to the docs hub (`qa/open` or `architecture/`). */
export function findDocsHubRoot(fromDir) {
  let dir = path.resolve(fromDir)
  for (let i = 0; i < 40; i++) {
    if (existsSync(path.join(dir, 'qa', 'open')) || existsSync(path.join(dir, 'architecture'))) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

export function openQaCsv(hubRoot, bundleId) {
  return getOpenQaDetails(hubRoot, bundleId).csv
}

export function getOpenQaDetails(hubRoot, bundleId) {
  if (!hubRoot || !bundleId) return { csv: '', techDebt: [] }
  const openDir = path.join(hubRoot, 'qa', 'open')
  if (!existsSync(openDir)) return { csv: '', techDebt: [] }
  const prefix = `QA-${bundleId}-`
  const ids = []
  const techDebt = []
  for (const name of readdirSync(openDir)) {
    if (!/\.ya?ml$/i.test(name)) continue
    const stem = name.replace(/\.ya?ml$/i, '')
    if (!stem.startsWith(prefix)) continue
    let id = stem
    let kind = ''
    let question = ''
    try {
      const parsed = parse(readFileSync(path.join(openDir, name), 'utf8'))
      if (parsed && typeof parsed.id === 'string' && parsed.id.trim()) id = parsed.id.trim()
      if (parsed && typeof parsed.kind === 'string') kind = parsed.kind
      if (parsed && typeof parsed.question === 'string') question = parsed.question.trim().split('\n')[0]
    } catch {
      /* filename */
    }
    ids.push(id)
    if (kind === 'tech-debt') {
      techDebt.push({ id, status: 'open', summary: question })
    }
  }
  ids.sort()
  techDebt.sort((a, b) => a.id.localeCompare(b.id))
  return { csv: ids.join(', '), techDebt }
}

const QA_FIELD = 'Q&A'

/** Set or remove `Q&A` on a business spec object (comma-separated ids). */
export function applyOpenQaField(spec, bundlePath, bundleId) {
  const hub = findDocsHubRoot(path.dirname(path.resolve(bundlePath)))
  const qa = getOpenQaDetails(hub, bundleId)
  if (qa.csv) spec[QA_FIELD] = qa.csv
  else delete spec[QA_FIELD]
  if (qa.techDebt && qa.techDebt.length > 0) spec.pendingTechDebt = qa.techDebt
  else delete spec.pendingTechDebt
  return spec
}
