import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { stringify } from 'yaml'
import {
  renderZoneItemsBusiness,
  renderPageComposition,
  renderZonesTable,
  renderZoneItemsTechTable,
  renderBehaviorTable,
  renderActionsTable
} from './render-design-tables.mjs'
import ejs from 'ejs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultTemplatesDir = path.resolve(__dirname, '../../../templates/shared/templates')

/**
 * Resolves a template file by name.
 * Looks in process.cwd() + '/.docskit/templates/' first,
 * then falls back to the package templates directory.
 * 
 * @param {string} templateName
 * @returns {string}
 */
export function resolveTemplatePath(templateName) {
  const localDir = path.join(process.cwd(), '.docskit', 'templates')
  const localPath = path.join(localDir, `${templateName}.ejs`)
  if (fs.existsSync(localPath)) {
    return localPath
  }

  const defaultPath = path.join(defaultTemplatesDir, `${templateName}.ejs`)
  if (fs.existsSync(defaultPath)) {
    return defaultPath
  }

  // Fallback to default-layout if template not found
  return path.join(defaultTemplatesDir, 'default-layout.ejs')
}

/**
 * Render spec/bundle data using an EJS template.
 * 
 * @param {Record<string, any>} spec
 * @param {Record<string, any>} context
 * @returns {string}
 */
export function renderWithTemplate(spec, context) {
  const templateName = spec.template || 'default-layout'
  const templatePath = resolveTemplatePath(templateName)
  const templateContent = fs.readFileSync(templatePath, 'utf8')

  // Extend context with stringify helper and renderScreenLink proxy
  const ejsContext = {
    ...context,
    stringify,
    renderZoneItemsBusiness,
    renderPageComposition,
    renderZonesTable,
    renderZoneItemsTechTable,
    renderBehaviorTable,
    renderActionsTable
  }

  const body = ejs.render(templateContent, { spec, context: ejsContext })
  return body.endsWith('\n') ? body : `${body}\n`
}
