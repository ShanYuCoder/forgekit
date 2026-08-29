import {
  createEndpoint,
  listEndpoint,
  pluralize,
  resolveCodegenNamespace,
  buildMockRowsFromSpec,
  routeToPagePath,
  toCamelCase,
  toKebabCase,
  toPascalCase,
  zodFieldForColumn,
  zodFieldForFormField
} from './naming.mjs'
import { applyDesignRegistry, validateSpecDesign, parseDesignTags } from './design-registry.mjs'
import { resolveComponentFiles } from './component-resolve.mjs'
import { buildSlotBindings, collectUniqueComponents } from './slots.mjs'
import { resolveUiInventory } from '../../../../shared/fe-ui-inventory.mjs'
import {
  routeToAppPagePath,
  webComponentPath,
  webHookPath,
  webMockPath,
  webServicePath,
  webStorePath,
  webValidationPath
} from './web-paths.mjs'
import {
  assertFeProfileMatchesRoute,
  isErrorPageProfile,
  isFormPageProfile,
} from '../../../../shared/fe-layout-profiles.mjs'

const TAG_PREFIX = {
  needsComponent: '#needs-component:',
  customSlot: '#custom-slot:',
  manualComposable: '#manual-composable:',
  skipCodegen: '#skip-codegen:',
  wireOnly: '#wire-only:',
  splitHook: '#split-hook:'
}

/** @param {string[]} tags */
export function parseTags(tags = []) {
  const parsed = {
    needsComponents: [],
    customSlots: [],
    manualComposables: [],
    skipCodegen: [],
    wireOnly: [],
    patterns: [],
    splitHooks: [],
    reuseApi: false,
    raw: tags
  }

  for (const tag of tags) {
    const text = String(tag).trim()
    if (text.startsWith(TAG_PREFIX.needsComponent)) {
      parsed.needsComponents.push(text.slice(TAG_PREFIX.needsComponent.length).trim())
    } else if (text.startsWith(TAG_PREFIX.customSlot)) {
      parsed.customSlots.push(text.slice(TAG_PREFIX.customSlot.length).trim())
    } else if (text.startsWith(TAG_PREFIX.manualComposable)) {
      parsed.manualComposables.push(text.slice(TAG_PREFIX.manualComposable.length).trim())
    } else if (text.startsWith(TAG_PREFIX.skipCodegen)) {
      parsed.skipCodegen.push(text.slice(TAG_PREFIX.skipCodegen.length).trim())
    } else if (text.startsWith(TAG_PREFIX.wireOnly)) {
      parsed.wireOnly.push(text.slice(TAG_PREFIX.wireOnly.length).trim())
    } else if (text.startsWith(TAG_PREFIX.splitHook)) {
      parsed.splitHooks.push(text.slice(TAG_PREFIX.splitHook.length).trim())
    } else if (text.startsWith('#pattern:')) {
      parsed.patterns.push(text.slice('#pattern:'.length).trim())
    } else if (text === '#reuse-api') {
      parsed.reuseApi = true
    }
  }

  return parsed
}

/** Auto-add custom slot tags from columns with render: custom */
function mergeCustomSlots(columns, parsedTags) {
  const slots = new Set(parsedTags.customSlots)
  for (const col of columns) {
    if (col.render === 'custom') {
      slots.add(`cell-${col.key}`)
    }
  }
  return [...slots]
}

/**
 * @param {import('yaml').Document.Parsed | Record<string, unknown>} spec
 * @param {string} specFile
 */
export function buildCodegenContext(spec, specFile) {
  const codegen = spec.codegen ?? {}
  const namespaceKebab = resolveCodegenNamespace(codegen)
  const entity = namespaceKebab
  const module = codegen.module ?? pluralize(entity)
  const profile = codegen.profile ?? 'list'
  const entityPascal = toPascalCase(namespaceKebab)
  const entityCamel = toCamelCase(namespaceKebab)
  const moduleKebab = toKebabCase(module)

  const inventory = resolveUiInventory(spec)
  const route = spec.ui?.routes?.[0] ?? { path: `/${moduleKebab}`, pageTestId: `${moduleKebab}-page` }
  assertFeProfileMatchesRoute(profile, route.path)
  const listRoutePath = String(route.path ?? `/${moduleKebab}`).replace(/\/create$/, '') || `/${moduleKebab}`
  const testIdModule = spec.ui?.testIds?.module ?? moduleKebab
  const columns = inventory.columns
  const filters = inventory.filters
  const formFields = inventory.formFields
  const commonValidationMessages = spec.ui?.validationMessages ?? {}

  const parsedTags = parseTags(inventory.tags)
  parsedTags.customSlots = mergeCustomSlots(columns, parsedTags)

  const skip = new Set([
    ...(codegen.skip ?? []),
    ...parsedTags.skipCodegen.map((s) => s.toLowerCase())
  ])

  const listEp = listEndpoint(spec)
  const createEp = createEndpoint(spec)
  const exportEp =
    spec.api?.endpoints?.find((e) => e.action === 'export') ??
    spec.api?.endpoints?.find((e) => /export/i.test(e.path ?? ''))

  const columnSchemas = columns.map((col) => ({
    ...col,
    zodField: zodFieldForColumn(col)
  }))

  const formFieldSchemas = formFields.map((field) => ({
    ...field,
    zodField: zodFieldForFormField(field, commonValidationMessages)
  }))

  const useCustomShell =
    spec.ui?.composition?.pattern === 'custom' || spec.ui?.composition?.overrideCommonPattern === true

  const embeddedBlocks = spec.ui?.embeddedBlocks ?? []
  const toolbar = spec.ui?.toolbar ?? {}
  const defaultPageSize = toolbar.defaultPageSize ?? 10
  const pageSizeOptions = toolbar.pageSizeOptions ?? []
  const hasPerPageToolbar = pageSizeOptions.length > 0
  const perPageConfig = toolbar.perPage ?? {}
  const manualComposables = parsedTags.manualComposables
  const hasExportBlock = embeddedBlocks.some((block) => block.id === 'export-open-rate') ||
    manualComposables.includes('exportOpenRateReport')
  const hasLoginAs = manualComposables.includes('loginAsStoreManager')

  const splitHooksSet = new Set(parsedTags.splitHooks)
  if (columns.length > 8) splitHooksSet.add('columns')
  if (filters.length > 3) splitHooksSet.add('filters')
  if (hasExportBlock) splitHooksSet.add('export')
  parsedTags.splitHooks = Array.from(splitHooksSet)

  const mockRowsPage1 = buildMockRowsFromSpec(spec, spec.title ?? entityPascal)
  const mockRowsPage2 = buildMockRowsFromSpec(spec, spec.title ?? entityPascal).map((row, index) => ({
    ...row,
    id: Number(row.id ?? index + 1) + 100,
    name: `${row.name ?? 'Item'} (page 2)`
  }))

  const customSlots = mergeCustomSlots(columns, parsedTags)
  const slotBindings = buildSlotBindings(customSlots, parsedTags.needsComponents, columns)

  return {
    spec,
    specFile,
    profile,
    entity,
    namespaceKebab,
    module,
    entityPascal,
    entityCamel,
    moduleKebab,
    testIdModule,
    title: spec.title ?? entityPascal,
    summary: spec.summary ?? '',
    route,
    listRoutePath,
    pagePath: routeToPagePath(route.path, profile),
    columns,
    columnSchemas,
    filters,
    formFields,
    formFieldSchemas,
    commonValidationMessages,
    listEndpoint: listEp,
    createEndpoint: createEp,
    exportEndpoint: exportEp,
    parsedTags,
    skip,
    useCustomShell,
    embeddedBlocks,
    toolbar,
    defaultPageSize,
    pageSizeOptions,
    hasPerPageToolbar,
    perPageConfig,
    hasExportBlock,
    hasLoginAs,
    mockRowsPage1,
    mockRowsPage2,
    manualComposables,
    customSlots,
    slotBindings,
    nav: inventory.nav,
    designSections: inventory.sections,
    designActions: inventory.actions,
    componentFiles: {},
    componentStubs: [],
    handoffItems: buildHandoffItems(spec, parsedTags, useCustomShell, slotBindings, {})
  }
}

/**
 * Resolve component paths and refresh handoff + stub list.
 * @param {ReturnType<typeof buildCodegenContext>} ctx
 * @param {string} root
 */
export async function enrichCodegenContext(ctx, root) {
  const components = collectUniqueComponents(ctx.slotBindings)
  const componentFiles = await resolveComponentFiles(root, components)

  ctx.slotBindings = ctx.slotBindings.map((binding) => {
    if (!binding.component) return binding
    const exists = Boolean(componentFiles[binding.component]?.exists)
    return {
      ...binding,
      intendedComponent: binding.component,
      wired: exists
    }
  })

  ctx.componentFiles = componentFiles
  ctx.componentStubs = []
  ctx.handoffItems = buildHandoffItems(
    ctx.spec,
    ctx.parsedTags,
    ctx.useCustomShell,
    ctx.slotBindings,
    componentFiles
  )

  return ctx
}

function buildHandoffItems(spec, parsedTags, useCustomShell, slotBindings, componentFiles) {
  const items = []
  const designTags = parseDesignTags(spec.tags ?? [])

  if (useCustomShell) {
    items.push({
      type: 'override-shell',
      detail: 'ui.composition.overrideCommonPattern or pattern: custom — implement organism shell in /prototype.'
    })
  } else if (spec.tags && spec.tags.some(t => t.startsWith('#shell:'))) {
    const shellTag = spec.tags.find(t => t.startsWith('#shell:')).split(':')[1].trim()
    // If the shell is not custom, but it's unknown, it will be handled as a missing shell by the template.
    // For now we just push a custom slot so developers know.
    if (!useCustomShell) {
      items.push({
        type: 'custom-slot',
        name: `shell-${shellTag}`,
        detail: `Unknown shell ${shellTag} — please implement manually or provide a valid shell template.`
      })
    }
  }

  for (const binding of slotBindings) {
    if (binding.component) {
      const file = componentFiles[binding.component]
      if (!file?.exists) {
        items.push({
          type: 'needs-component',
          name: binding.component,
          detail:
            `Slot #${binding.slot} — implement \`${binding.component}\` in /prototype (spec tag already names it). ` +
            'Re-run codegenkit gen after the file exists. Common widget → update registry per DESIGN-REGISTRY-PROMOTION.md.'
        })
      }
      continue
    }

    items.push({
      type: 'custom-slot',
      name: binding.slot,
      detail: `Add #needs-component: ${binding.slot}:MoYourComponent:prop in spec (/grill-with-docs), implement in /prototype, then re-run codegenkit gen.`
    })
  }

  for (const widget of designTags.needsUi) {
    items.push({
      type: 'needs-ui',
      name: widget,
      detail:
        `Registry widget \`${widget}\` is planned — implement molecule in /prototype, promote registry if reusable, then re-run codegenkit gen.`
    })
  }

  for (const fn of parsedTags.manualComposables) {
    items.push({ type: 'manual-composable', name: fn, detail: `Implement composable function: ${fn}` })
  }

  for (const topic of parsedTags.wireOnly) {
    items.push({ type: 'wire-only', name: topic, detail: `Defer until /wire: ${topic}` })
  }

  for (const q of spec.openQuestions ?? []) {
    const detail =
      typeof q === 'string'
        ? q
        : q?.question ?? q?.id ?? JSON.stringify(q)
    items.push({ type: 'open-question', detail: String(detail) })
  }

  items.push({
    type: 'contract-gen',
    detail:
      'Run `codegenkit contract-gen --spec <ir/design.yaml>` before codegenkit gen if @portal/models entity package is missing.'
  })

  return items
}

/**
 * @param {ReturnType<typeof buildCodegenContext>} ctx
 */
export function buildFilePlan(ctx) {
  const { entity, entityPascal, profile, skip } = ctx
  const files = []

  const add = (layer, relativePath, template) => {
    if (skip.has(layer)) return
    if (layer === 'models') return
    files.push({ layer, relativePath, template })
  }

  if (profile === 'list') {
    const listTemplate =
      ctx.listPageTemplate ??
      (ctx.useCustomShell ? 'list/page.custom.tsx.hbs' : 'list/page.tsx.hbs')

    add('service', webServicePath(`${entity}.service.ts`), 'list/service.ts.hbs')
    add('hook', webHookPath(`${entity}/use${entityPascal}Columns.ts`), 'list/useListColumns.ts.hbs')
    add('hook', webHookPath(`${entity}/use${entityPascal}Filters.ts`), 'list/useListFilters.ts.hbs')
    if (ctx.hasExportBlock) {
      add('hook', webHookPath(`${entity}/use${entityPascal}Export.ts`), 'list/useListExport.ts.hbs')
    }
    add('hook', webHookPath(`${entity}/use${entityPascal}List.ts`), 'list/useList.ts.hbs')
    add('page', ctx.pagePath ?? routeToAppPagePath(ctx.route.path, ctx.profile), listTemplate)
    add('mock', webMockPath(`${entity}.mock.ts`), 'list/mock.ts.hbs')
  }

  if (isFormPageProfile(profile) || ctx.formFields?.length > 0) {
    add('service', webServicePath(`${entity}Form.service.ts`), 'create/service.ts.hbs')
    add('hook', webHookPath(`${entity}/use${entityPascal}Form.ts`), 'create/useForm.ts.hbs')
    add('validation', webValidationPath(`${entity}/schemas.ts`), 'create/validation.ts.hbs')
    add('component', webComponentPath(`${entity}/${entityPascal}Form.tsx`), 'create/form.tsx.hbs')
  }

  if (isFormPageProfile(profile) || isErrorPageProfile(profile)) {
    add('page', ctx.pagePath ?? routeToAppPagePath(ctx.route.path, ctx.profile), 'create/page.tsx.hbs')
    if (isFormPageProfile(profile)) {
      add('mock', webMockPath(`${entity}.mock.ts`), 'create/mock.ts.hbs')
    }
  }

  const hasStoreTag = ctx.spec.tags && ctx.spec.tags.some(t => t.trim() === '#use-store')
  if (hasStoreTag) {
    add('store', webStorePath(`use${entityPascal}Store.ts`), 'store/store.ts.hbs')
  }

  return files
}

/**
 * Apply portal design registry and optional validation.
 * @param {ReturnType<typeof buildCodegenContext>} ctx
 * @param {Record<string, unknown>} registry
 * @param {{ validate?: boolean }} options
 */
export function applyRegistryToContext(ctx, registry, options = {}) {
  applyDesignRegistry(ctx, registry)

  if (options.validate) {
    const { errors, warnings } = validateSpecDesign(ctx, registry, { strict: false })
    ctx.designValidation = { errors, warnings }
    if (errors.length > 0) {
      const message = errors.map((e) => `  - ${e}`).join('\n')
      throw new Error(`portal-gen design registry validation failed:\n${message}`)
    }
  }

  return ctx
}
