import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Merges spec.i18n block flatly into the target locale JSON files.
 * @param {object} specI18n - The i18n object from spec (e.g. { "Username": { "vi": "Tên đăng nhập", "en": "Username" } })
 * @param {string} localesDir - The directory where locale JSON files are stored (e.g., locales/ or lang/ or src/i18n/)
 * @param {boolean} dryRun - Whether to actually write the file or just return the modified data.
 * @returns {Array<{ path: string, keysAdded: number }>} - Summary of written files
 */
export function mergeI18nFlat(specI18n, localesDir, dryRun = false) {
  if (!specI18n || typeof specI18n !== 'object') return []

  const writtenFiles = []
  const dataByLang = {}

  // Pivot data from { "key": { "vi": "val", "en": "val" } } to { "vi": { "key": "val" }, "en": { "key": "val" } }
  for (const [key, translations] of Object.entries(specI18n)) {
    if (typeof translations === 'object') {
      for (const [lang, val] of Object.entries(translations)) {
        if (!dataByLang[lang]) dataByLang[lang] = {}
        dataByLang[lang][key] = val
      }
    }
  }

  for (const [lang, newKeys] of Object.entries(dataByLang)) {
    const localePath = path.join(localesDir, `${lang}.json`)
    let currentData = {}

    if (existsSync(localePath)) {
      try {
        currentData = JSON.parse(readFileSync(localePath, 'utf8'))
      } catch (e) {
        // Assume empty object if invalid JSON
        currentData = {}
      }
    }

    // Flat merge
    let keysAdded = 0
    for (const [key, val] of Object.entries(newKeys)) {
      currentData[key] = val
      keysAdded++
    }

    if (!dryRun) {
      mkdirSync(localesDir, { recursive: true })
      writeFileSync(localePath, JSON.stringify(currentData, null, 2) + '\n', 'utf8')
    }

    writtenFiles.push({ path: localePath, keysAdded })
  }

  return writtenFiles
}
