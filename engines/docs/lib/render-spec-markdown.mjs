import { renderScreenLink } from './route-page-probe.mjs'
import { renderWithTemplate } from './render-template.mjs'

/**
 * @param {Record<string, unknown>} spec
 * @param {{
 *   testcases: Array<{ file: string, data: Record<string, unknown> }>,
 *   output: { testcasesDir: string, specFile: string },
 *   devAppBaseUrl: string,
 *   projectRoot: string
 * }} context
 */
export function renderSpecMarkdown(spec, context) {
  const ejsContext = {
    ...context,
    renderScreenLink: (path) => renderScreenLink(path, context.devAppBaseUrl, context.projectRoot)
  }
  return renderWithTemplate(spec, ejsContext)
}
