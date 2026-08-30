/**
 * portal-feature-bundle/v1 — design spec vs portal-gen (gen) split.
 * bundle.spec = design v1 · bundle.gen = dev-grill / portal:gen fields · ir/spec = merged
 */

export const BUNDLE_SCHEMA = 'portal-feature-bundle/v1'

export const BUNDLE_META_KEYS = [
  'id',
  'page-id',
  'title',
  'status',
  'owner',
  'summary',
  'specOrigin',
  'grillStatus'
]

/** Top-level keys in spec/gen that belong in ir/spec for portal:gen — not design v1 authoring */
export const GEN_TOP_KEYS = ['codegen', 'tags']

/** ui.* keys owned by dev-grill / portal:gen */
export const GEN_UI_KEYS = ['filters', 'columns', 'composition', 'testIds']

/** Keys that belong on ir/design.yaml (tech), not ir/spec.yaml (business prose). */
export const TECH_IR_KEYS = ['codegen', 'tags', 'ui', 'api', 'entities', 'relationships']

export const DESIGN_LAYOUT_KEYS = [
  'inherits',
  'shell',
  'patterns',
  'nav',
  'sections',
  'zones',
  'behavior',
  'actions',
  'deviations',
  'i18n'
]

/**
 * @param {Record<string, unknown>} specSection
 * @param {Record<string, unknown>} [bundleGen]
 */
export function partitionSpecSection(specSection = {}, bundleGen = {}) {
  const designSpec = { ...specSection }
  const gen = structuredClone(bundleGen ?? {})

  for (const key of GEN_TOP_KEYS) {
    if (designSpec[key] != null && gen[key] == null) gen[key] = designSpec[key]
    delete designSpec[key]
  }

  if (designSpec.ui && typeof designSpec.ui === 'object') {
    gen.ui = gen.ui ?? {}
    const ui = { ...designSpec.ui }
    for (const key of GEN_UI_KEYS) {
      if (ui[key] != null && gen.ui[key] == null) gen.ui[key] = ui[key]
      delete ui[key]
    }
    designSpec.ui = ui
  }

  return { designSpec, gen: pruneGen(gen) }
}

/**
 * Merge design spec + gen → flat ir/spec shape (portal:gen input).
 * @param {Record<string, unknown>} meta
 * @param {Record<string, unknown>} designSpec
 * @param {Record<string, unknown>} gen
 */
export function mergeIrSpec(meta, designSpec = {}, gen = {}) {
  const ir = { ...meta, ...designSpec }

  for (const key of GEN_TOP_KEYS) {
    if (gen[key] != null) ir[key] = gen[key]
  }

  if (gen.ui && typeof gen.ui === 'object') {
    ir.ui = { ...(ir.ui ?? {}) }
    for (const key of GEN_UI_KEYS) {
      if (gen.ui[key] != null) ir.ui[key] = gen.ui[key]
    }
  }

  return ir
}

/**
 * @param {Record<string, unknown>} irSpec
 */
export function partitionIrSpec(irSpec = {}) {
  const meta = {}
  for (const key of BUNDLE_META_KEYS) {
    if (irSpec[key] != null) meta[key] = irSpec[key]
  }
  const specBody = { ...irSpec }
  for (const key of [...BUNDLE_META_KEYS, ...DESIGN_LAYOUT_KEYS, 'openQuestions', 'qa', 'Q&A']) delete specBody[key]

  const { designSpec, gen } = partitionSpecSection(specBody, {})
  return { meta, designSpec, gen }
}

function pruneGen(gen) {
  const out = { ...gen }
  if (out.codegen === null) delete out.codegen
  if (out.ui && !Object.keys(out.ui).length) delete out.ui
  if (!Object.keys(out).length) return {}
  return out
}

function nonEmptyField(value) {
  return typeof value === 'string' && value.trim().length > 0 && value !== '#missing_info'
}

export function codegenProfileReady(gen = {}) {
  return nonEmptyField(gen?.codegen?.profile)
}

/** Profiles that codegenkit resolves via codegen.entity + codegen.module (no silent modules[0]). */
export const CODEGEN_ENTITY_PROFILES = new Set([
  'list',
  'create',
  'edit',
  'detail',
  'admin-crud',
  'crud-standard',
  'auth',
  'change-password',
  'public',
  'select-item',
  'free',
  'setting',
  'export',
  'import',
  'dashboard-stats',
])

export function codegenEntityModuleReady(gen = {}) {
  const profile = String(gen?.codegen?.profile ?? '').trim()
  if (!CODEGEN_ENTITY_PROFILES.has(profile)) return true
  return nonEmptyField(gen?.codegen?.entity) && nonEmptyField(gen?.codegen?.module)
}

export const ENDPOINT_ACTION_SUFFIXES = [
  'list',
  'search',
  'create',
  'update',
  'duplicate',
  'delete',
  'detail',
  'permissions',
]

export function endpointsActionReady(api = {}) {
  const endpoints = api?.endpoints
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    return { ok: true, problems: [] }
  }
  const problems = []
  for (const ep of endpoints) {
    const id = ep?.id ?? ep?.path ?? '?'
    const action = String(ep?.action ?? '').trim()
    const route = String(ep?.path ?? '')
    if (!nonEmptyField(action)) {
      problems.push(`endpoint ${id} missing action`)
      continue
    }
    const hasSuffix =
      ENDPOINT_ACTION_SUFFIXES.some((s) => route.includes(`/${s}`)) || route.includes(`/${action}`)
    if (!hasSuffix) problems.push(`endpoint ${id} path missing action suffix (/${action})`)
  }
  return { ok: problems.length === 0, problems }
}

export function expectedGenTestTags(profile) {
  const p = String(profile ?? '').trim()
  if (p === 'list' || p === 'admin-crud' || p === 'select-item' || p === 'export' || p === 'dashboard-stats') return ['#gen:test-schema', '#gen:test-service']
  if (p === 'create' || p === 'edit' || p === 'auth' || p === 'change-password' || p === 'public' || p === 'setting' || p === 'import') {
    return ['#gen:test-validation']
  }
  return []
}

export function missingGenTestTags(gen = {}) {
  const expected = expectedGenTestTags(gen?.codegen?.profile)
  const tags = new Set((gen?.tags ?? []).map((t) => String(t)))
  return expected.filter((t) => !tags.has(t))
}

export function hasGenContent(gen = {}) {
  if (!gen || typeof gen !== 'object') return false
  if (GEN_TOP_KEYS.some((k) => gen[k] != null)) return true
  if (gen.ui && GEN_UI_KEYS.some((k) => gen.ui[k] != null)) return true
  return false
}
