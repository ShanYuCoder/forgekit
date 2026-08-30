/**
 * Split portal-feature-bundle → ir/{spec,legacy,design}.yaml
 */

import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { parse, stringify } from 'yaml'
import {
  BUNDLE_META_KEYS,
  DESIGN_LAYOUT_KEYS,
  GEN_UI_KEYS,
  TECH_IR_KEYS,
  hasGenContent,
  partitionSpecSection,
  codegenProfileReady,
  codegenEntityModuleReady,
  endpointsActionReady,
  missingGenTestTags,
} from './bundle-schema.mjs'
import { applyOpenQaField } from './open-qa.mjs'
import { applyDesignApiFrom01 } from './hydrate-design-api.mjs'
import { isPlaceholderLegacy, projectBusinessPage } from './project-business-layout.mjs'

export function bundlePageId(bundle) {
  const v = bundle?.['page-id'] ?? bundle?.pageId ?? bundle?.id
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

/**
 * @param {Record<string, unknown>} bundle
 */
export function buildIrFromBundle(bundle) {
  const meta = {}
  for (const key of BUNDLE_META_KEYS) {
    if (bundle[key] != null) meta[key] = bundle[key]
  }
  const { designSpec, gen } = partitionSpecSection(bundle.spec ?? {}, bundle.gen ?? {})
  const spec = buildBusinessSpec(meta, designSpec, bundle)
  const pageId = bundlePageId(bundle)
  const legacy = { id: pageId, ...(bundle.legacy ?? {}) }
  const design = buildDesignIr(bundle, designSpec, gen)

  return { spec, legacy, design, designSpec, gen }
}

/** ir/spec.yaml — business prose + page inventory (no ids/tags/bind/components). */
export function buildBusinessSpec(meta, designSpec = {}, bundle = {}) {
  const spec = { ...meta }
  delete spec.id
  const pageId = bundlePageId(bundle)
  if (pageId) spec['page-id'] = pageId
  for (const [key, value] of Object.entries(designSpec)) {
    if (TECH_IR_KEYS.includes(key)) continue
    spec[key] = value
  }
  Object.assign(spec, projectBusinessPage(bundle.design ?? {}))
  const i18nObj = bundle.i18n ?? bundle.design?.i18n
  if (i18nObj) spec.i18n = i18nObj
  if (!isPlaceholderLegacy(bundle.legacy)) spec.legacy = bundle.legacy
  return spec
}

/**
 * ir/design.yaml — tech SSOT for FE/BE/testkit (layout + ui + api + entities + codegen).
 */
export function buildDesignIr(bundle, designSpec = {}, gen = {}) {
  const pageId = bundlePageId(bundle)
  const design = { id: pageId, ...(bundle.design ?? {}) }
  if (bundle.title != null) design.title = bundle.title
  if (bundle.i18n != null && design.i18n == null) design.i18n = bundle.i18n

  if (gen.codegen != null) design.codegen = gen.codegen
  if (gen.tags != null) design.tags = gen.tags

  const ui = { ...(designSpec.ui ?? {}) }
  if (gen.ui && typeof gen.ui === 'object') {
    for (const [key, value] of Object.entries(gen.ui)) {
      if (value != null) ui[key] = value
    }
  }
  if (design.ui && typeof design.ui === 'object') {
    Object.assign(ui, design.ui)
  }
  if (Object.keys(ui).length) design.ui = ui

  if (designSpec.entities != null) design.entities = designSpec.entities
  if (designSpec.relationships != null) design.relationships = designSpec.relationships

  return design
}

function pickLayout(designIr) {
  const out = {}
  for (const key of DESIGN_LAYOUT_KEYS) {
    if (designIr[key] != null) out[key] = designIr[key]
  }
  return out
}

function restoreComments(sourceYaml, generatedYaml) {
  let result = generatedYaml
  const lines = sourceYaml.split('\n')
  
  for (const line of lines) {
    const match = line.match(/^([^#]+?)\s+#(.+)$/)
    if (!match) continue
    
    const codePart = match[1].trimEnd()
    const commentPart = match[2]
    
    const trimmedCode = codePart.trimStart()
    if (!trimmedCode) continue 
    
    let safeCode = trimmedCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    const kvMatch = trimmedCode.match(/^(-\s+)?([a-zA-Z0-9_-]+):\s*(.+)$/)
    if (kvMatch) {
      const prefix = kvMatch[1] || ''
      const key = kvMatch[2]
      let val = kvMatch[3].trim()
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1)
      }
      const safePrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const safeVal = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      safeCode = `${safePrefix}${safeKey}:\\s*['"]?${safeVal}['"]?`
    }
    
    const replaceRegex = new RegExp(`(^|\\n)(\\s*${safeCode}\\s*)(?!\\s*#)(\\r?\\n|$)`, 'g')
    result = result.replace(replaceRegex, `$1$2 #${commentPart.trim()}$3`)
  }
  
  return result
}

/**
 * @param {string} bundlePath
 * @param {{ dryRun?: boolean }} [options]
 */
export async function splitBundleFile(bundlePath, options = {}) {
  const absolute = path.resolve(bundlePath)
  const dir = path.dirname(absolute)
  const irDir = path.join(dir, 'ir')
  const rawYaml = await readFile(absolute, 'utf8')
  const bundle = parse(rawYaml) ?? {}

  const pageId = bundlePageId(bundle)
  if (!pageId) {
    throw new Error(`Bundle missing page-id: ${bundlePath}`)
  }

  const { spec, legacy, design } = buildIrFromBundle(bundle)
  applyOpenQaField(spec, absolute, pageId)
  applyDesignApiFrom01(design, dir)
  const yamlOpts = { lineWidth: 0 }

  emitCodegenGates(bundle, design, { throwOnFail: true })

  if (!options.dryRun) {
    await mkdir(irDir, { recursive: true })
    
    const specYaml = restoreComments(
      rawYaml, 
      stringify(spec, yamlOpts)
    )

    await writeFile(
      path.join(irDir, 'spec.yaml'),
      `# Generated from ${path.basename(bundlePath)} — pnpm spec:split (business prose)\n${specYaml}`,
      'utf8'
    )
    await writeFile(
      path.join(irDir, 'design.yaml'),
      `# Generated from ${path.basename(bundlePath)} — pnpm spec:split (tech: FE/BE/testkit)\n${stringify(design, yamlOpts)}`,
      'utf8'
    )
    try {
      await unlink(path.join(irDir, 'legacy.yaml'))
    } catch {
      /* optional leftover */
    }
  }

  return { bundlePath: absolute, irDir, spec, legacy, design }
}

/**
 * @param {string} bundlePath
 */
export async function checkSplitBundle(bundlePath) {
  const absolute = path.resolve(bundlePath)
  const irDir = path.join(path.dirname(absolute), 'ir')
  const rawYaml = await readFile(absolute, 'utf8')
  const bundle = parse(rawYaml) ?? {}
  const expected = buildIrFromBundle(bundle)
  applyOpenQaField(expected.spec, absolute, bundlePageId(bundle))
  applyDesignApiFrom01(expected.design, path.dirname(absolute))
  const files = ['spec', 'design']
  const mismatches = []

  for (const name of files) {
    const irPath = path.join(irDir, `${name}.yaml`)
    let actual
    try {
      actual = parse(await readFile(irPath, 'utf8')) ?? {}
    } catch {
      mismatches.push(`${name}.yaml missing`)
      continue
    }
    const expStr = name === 'spec' 
      ? restoreComments(rawYaml, stringify(expected[name], { lineWidth: 0 })).trim()
      : stringify(expected[name], { lineWidth: 0 }).trim()
    
    // We should also strip the first line `# Generated...` if we compare actual string but we parse actual so comments are gone in actual.
    // Wait, the original check uses `stringify(actual)` which will not have comments anyway,
    // so if we add comments to expected[spec], it will mismatch with actual because actual lost comments when parsed!
    // But actual was parsed without comments, so `stringify(actual)` has no comments.
    // If we want check to pass, we should compare without comments. 
    // Let's just compare the plain stringify for check logic, it's safer.
    
    const plainExpStr = stringify(expected[name], { lineWidth: 0 }).trim()
    const actStr = stringify(actual, { lineWidth: 0 }).trim()
    if (plainExpStr !== actStr) mismatches.push(`${name}.yaml out of sync with bundle`)
  }

  const posix = absolute.split(path.sep).join('/')
  if (posix.includes('/common/yaml/') && mismatches.includes('design.yaml missing')) {
    mismatches.push('common yaml bundle must emit ir/design.yaml')
  }

  try {
    emitCodegenGates(bundle, expected.design, { throwOnFail: true })
  } catch (err) {
    mismatches.push(err instanceof Error ? err.message : String(err))
  }

  return { ok: mismatches.length === 0, mismatches }
}

function emitCodegenGates(bundle, design, { throwOnFail }) {
  const grillDone =
    bundle.grillStatus?.dev === 'done' || bundle.grillStatus?.full === 'done'
  const gen = { codegen: design.codegen, tags: design.tags }
  const failOrWarn = (msg) => {
    if (grillDone && throwOnFail) throw new Error(msg)
    console.warn(`spec:split: warn: ${msg}`)
  }

  if (!codegenProfileReady(gen)) {
    failOrWarn(
      `bundle.gen.codegen.profile empty — codegenkit cannot gen (${bundlePageId(bundle)}). Fill in /grill-dev.`,
    )
  }
  if (!codegenEntityModuleReady(gen)) {
    failOrWarn(
      `bundle.gen.codegen.entity/module empty for profile ${gen.codegen?.profile} (${bundlePageId(bundle)}). Fill in /grill-dev.`,
    )
  }
  const actions = endpointsActionReady(design.api ?? {})
  if (!actions.ok) {
    failOrWarn(`api.endpoints action/path incomplete (${bundlePageId(bundle)}): ${actions.problems.join('; ')}`)
  }
  const missingTags = missingGenTestTags(gen)
  if (missingTags.length) {
    console.warn(
      `spec:split: warn: missing tags ${missingTags.join(', ')} for profile ${gen.codegen?.profile} (${bundlePageId(bundle)})`,
    )
  }
}

/**
 * @param {string} bundlePath
 * @param {{ dryRun?: boolean }} [options]
 */
export async function mergeBundleFile(bundlePath, options = {}) {
  const absolute = path.resolve(bundlePath)
  const irDir = path.join(path.dirname(absolute), 'ir')
  const rawYaml = await readFile(absolute, 'utf8')
  const bundle = parse(rawYaml) ?? {}

  const specIr = parse(await readFile(path.join(irDir, 'spec.yaml'), 'utf8')) ?? {}
  const designIr = parse(await readFile(path.join(irDir, 'design.yaml'), 'utf8')) ?? {}
  let legacyFallback = {}
  try {
    legacyFallback = parse(await readFile(path.join(irDir, 'legacy.yaml'), 'utf8')) ?? {}
  } catch {
    legacyFallback = {}
  }

  for (const key of BUNDLE_META_KEYS) {
    if (specIr[key] != null) bundle[key] = specIr[key]
  }
  const mergedPageId = bundlePageId({ ...bundle, ...specIr })
  if (mergedPageId) {
    bundle['page-id'] = mergedPageId
    delete bundle.id
  }
  delete bundle.openQuestions
  delete bundle.qa
  delete bundle['Q&A']
  delete bundle.pendingTechDebt

  const businessBody = { ...specIr }
  for (const key of [
    ...BUNDLE_META_KEYS,
    ...DESIGN_LAYOUT_KEYS,
    'openQuestions',
    'legacy',
    'qa',
    'Q&A',
    'pendingTechDebt',
    'api',
  ]) {
    delete businessBody[key]
  }

  const ui = { ...(designIr.ui ?? {}) }
  const gen = {}
  if (designIr.codegen != null) gen.codegen = designIr.codegen
  if (designIr.tags != null) gen.tags = designIr.tags
  const genUi = {}
  for (const key of GEN_UI_KEYS) {
    if (ui[key] != null) {
      genUi[key] = ui[key]
      delete ui[key]
    }
  }
  if (Object.keys(genUi).length) gen.ui = genUi

  if (bundle.spec && typeof bundle.spec === 'object') delete bundle.spec.api

  bundle.spec = {
    ...businessBody,
    ...(Object.keys(ui).length ? { ui } : {}),
    ...(designIr.entities != null ? { entities: designIr.entities } : {}),
    ...(designIr.relationships != null ? { relationships: designIr.relationships } : {})
  }
  if (bundle.spec.api) delete bundle.spec.api
  if (hasGenContent(gen)) bundle.gen = gen
  else delete bundle.gen

  const legacySection = { ...(specIr.legacy ?? legacyFallback) }
  delete legacySection.id
  if (!isPlaceholderLegacy(legacySection)) bundle.legacy = legacySection
  else delete bundle.legacy

  const designSection = pickLayout(designIr)
  bundle.design = designSection

  if (!options.dryRun) {
    const mergedYaml = restoreComments(
      rawYaml, 
      stringify(bundle, { lineWidth: 0 })
    )
    await writeFile(absolute, mergedYaml, 'utf8')
  }

  return { bundlePath: absolute, bundle }
}
