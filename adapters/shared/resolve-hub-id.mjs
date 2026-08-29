/**
 * Resolve short hub IDs → filesystem paths (docs hub + tests hub).
 * IDs: W-* | API-* | UI-* | CMP-* | CTR-* | TC-* | SC-* | suite id (smoke, …)
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

function loadJson(file) {
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf8'))
}

function deepMerge(base, over) {
  if (!over || typeof over !== 'object') return base
  const out = { ...base }
  for (const [k, v] of Object.entries(over)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
      out[k] = deepMerge(base[k], v)
    } else out[k] = v
  }
  return out
}

export function loadPlatformRepos(repoRoot) {
  let doc = loadJson(path.join(repoRoot, 'platform-repos.json'))
  if (!doc) throw new Error(`Missing platform-repos.json in ${repoRoot}`)
  const local = loadJson(path.join(repoRoot, 'platform-repos.local.json'))
  if (local) doc = deepMerge(doc, local)
  return doc
}

export function resolveProjectRoot(repoRoot, projectId) {
  const doc = loadPlatformRepos(repoRoot)
  const proj = doc.projects?.[projectId]
  if (!proj?.root) throw new Error(`Unknown project "${projectId}" in platform-repos.json`)
  return path.resolve(repoRoot, proj.root)
}

export function loadDocsIndex(docsRoot) {
  const file = path.join(docsRoot, 'registries', 'docs-index.json')
  const idx = loadJson(file)
  if (!idx) {
    return buildDocsIndexFallback(docsRoot)
  }
  return idx
}

function buildDocsIndexFallback(docsRoot) {
  const codeIds = {}
  const modules = []
  const surfacesDir = path.join(docsRoot, 'product', 'surfaces')

  function scanSurfaces(dir) {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const fullPath = path.join(dir, entry.name)
        if (entry.name.startsWith('CMP-')) {
          const mod = { id: entry.name, slug: entry.name.toLowerCase(), codeIds: [], path: path.relative(docsRoot, fullPath).split(path.sep).join('/') }
          modules.push(mod)
          const cmpChildren = readdirSync(fullPath, { withFileTypes: true })
          for (const child of cmpChildren) {
             if (child.isDirectory() && !child.name.startsWith('.')) {
                const codeDir = path.join(fullPath, child.name, 'code')
                if (existsSync(codeDir)) {
                  for (const fnEntry of readdirSync(codeDir, { withFileTypes: true })) {
                    if (fnEntry.isDirectory() && !fnEntry.name.startsWith('.')) {
                      if (fnEntry.name.startsWith('W-') || fnEntry.name.startsWith('UI-') || fnEntry.name.startsWith('API-')) {
                        mod.codeIds.push(fnEntry.name)
                        codeIds[fnEntry.name] = path.relative(docsRoot, path.join(codeDir, fnEntry.name)).split(path.sep).join('/')
                      }
                    }
                  }
                }
             }
          }
        } else if (entry.name.startsWith('W-') || entry.name.startsWith('UI-') || entry.name.startsWith('API-')) {
          codeIds[entry.name] = path.relative(docsRoot, fullPath).split(path.sep).join('/')
        }
        scanSurfaces(fullPath)
      }
    }
  }

  scanSurfaces(surfacesDir)
  return { version: 1, codeIds, modules }
}

export function loadTestsIndex(testsRoot) {
  const file = path.join(testsRoot, 'registries', 'tests-index.json')
  const idx = loadJson(file)
  if (!idx) {
    return buildTestsIndexFallback(testsRoot)
  }
  return idx
}

/** Scan cases/ + suites/ when index missing */
function buildTestsIndexFallback(testsRoot) {
  const codeIds = {}
  const casesDir = path.join(testsRoot, 'cases')
  const suites = {}
  if (existsSync(casesDir)) {
    for (const screen of readdirSync(casesDir, { withFileTypes: true })) {
      if (!screen.isDirectory() || screen.name.startsWith('.')) continue
      const screenPath = path.join(casesDir, screen.name)
      codeIds[screen.name] = path.relative(testsRoot, screenPath).split(path.sep).join('/')
      for (const f of readdirSync(screenPath)) {
        if (/^TC-.*\.ya?ml$/i.test(f)) {
          const id = f.replace(/\.ya?ml$/i, '')
          codeIds[id] = path.relative(testsRoot, path.join(screenPath, f)).split(path.sep).join('/')
        }
      }
    }
  }
  const suitesDir = path.join(testsRoot, 'suites')
  if (existsSync(suitesDir)) {
    for (const f of readdirSync(suitesDir)) {
      if (!f.endsWith('.yaml') && !f.endsWith('.yml')) continue
      const raw = readFileSync(path.join(suitesDir, f), 'utf8')
      const idMatch = raw.match(/^id:\s*(\S+)/m)
      const sid = idMatch?.[1] || f.replace(/\.ya?ml$/i, '')
      suites[sid] = path.relative(testsRoot, path.join(suitesDir, f)).split(path.sep).join('/')
    }
  }
  return { version: 1, codeIds, suites, scenarios: {} }
}

function absUnder(root, rel) {
  if (!rel) return null
  const abs = path.resolve(root, rel)
  if (!existsSync(abs)) return null
  return abs
}

/** ir/design.yaml only. Missing file = incomplete split. */
export function preferFeDesign(codeDir) {
  if (!codeDir || !existsSync(codeDir)) return null
  const design = path.join(codeDir, 'ir', 'design.yaml')
  return existsSync(design) ? design : null
}

export function preferGenSpec(codeDir) {
  return preferFeDesign(codeDir)
}

export function listBackendSpecFiles(dir) {
  const files = []
  if (!dir || !existsSync(dir)) return files
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
      files.push(...listBackendSpecFiles(entryPath))
      continue
    }
    if (entry.isFile() && entry.name === '01-backend-spec.yaml') files.push(entryPath)
  }
  return files.sort()
}

export function leafDirFromCodePath(codeDir) {
  if (!codeDir) return codeDir
  const parts = codeDir.split(path.sep)
  const codeIdx = parts.lastIndexOf('code')
  if (codeIdx > 0) return parts.slice(0, codeIdx).join(path.sep)
  return codeDir
}

export function findCmpFolder(docsRoot, id) {
  const hits = []
  const walk = (dir) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      const full = path.join(dir, entry.name)
      if (entry.name === id) hits.push(full)
      else walk(full)
    }
  }
  walk(path.join(docsRoot, 'product', 'surfaces'))
  return hits[0] ?? null
}

function rejectProseSpec(specPath) {
  const base = path.basename(specPath)
  if (base === 'design.yaml' || base === 'spec.yaml' || specPath.endsWith(`${path.sep}ir${path.sep}design.yaml`) || specPath.endsWith(`${path.sep}ir${path.sep}spec.yaml`)) {
    throw new Error('BE input is 01-backend-spec.yaml (not ir/design.yaml or ir/spec.yaml)')
  }
}

export function resolveBackendSpecPaths(specOrDir) {
  const abs = path.resolve(specOrDir)
  if (!existsSync(abs)) throw new Error(`Not found: ${abs}`)
  const st = statSync(abs)
  if (st.isDirectory()) {
    const found = listBackendSpecFiles(abs)
    if (!found.length) throw new Error(`No 01-backend-spec.yaml under ${abs}`)
    return found
  }
  rejectProseSpec(abs)
  if (path.basename(abs) !== '01-backend-spec.yaml') {
    throw new Error(`Expected 01-backend-spec.yaml, got ${abs}`)
  }
  return [abs]
}

/**
 * @param {string} repoRoot FE/BE code repo (usually portal)
 * @param {string} id
 * @param {'codegen'|'api-codegen'|'testcase'} mode
 * @returns {{ kind: string, id: string, paths: string[], notes: string[] }}
 */
export function resolveHubId(repoRoot, id, mode = 'api-codegen') {
  if (!id || typeof id !== 'string') throw new Error('Missing --id')
  const notes = []
  const docsRoot = process.env.CODEGENKIT_DOCS_ROOT
    ? path.resolve(process.env.CODEGENKIT_DOCS_ROOT)
    : (() => {
        try { return resolveProjectRoot(repoRoot, 'docs') } catch {
          return resolveProjectRoot(repoRoot, 'base-docs')
        }
      })()
  let testsRoot
  try {
    testsRoot = process.env.CODEGENKIT_TESTS_ROOT
      ? path.resolve(process.env.CODEGENKIT_TESTS_ROOT)
      : (() => {
          try { return resolveProjectRoot(repoRoot, 'tests') } catch {
            return resolveProjectRoot(repoRoot, 'base-tests')
          }
        })()
  } catch (error) {
    if (mode === 'codegen' || mode === 'api-codegen') {
      testsRoot = docsRoot // unused for pure codegen
    } else {
      throw error
    }
  }
  const docsIdx = loadDocsIndex(docsRoot)
  const testsIdx = loadTestsIndex(testsRoot)

  // Suite
  if (testsIdx.suites?.[id]) {
    const suitePath = absUnder(testsRoot, testsIdx.suites[id])
    const raw = readFileSync(suitePath, 'utf8')
    const caseIds = [...raw.matchAll(/^\s*-\s+(TC-[\w-]+)/gm)].map((m) => m[1])
    const paths = []
    for (const cid of caseIds) {
      const rel = testsIdx.codeIds?.[cid]
      const p = absUnder(testsRoot, rel)
      if (p) paths.push(p)
      else notes.push(`suite ${id}: missing case ${cid}`)
    }
    return { kind: 'suite', id, paths, notes, suitePath }
  }

  // TC-* file
  if (/^TC-/i.test(id)) {
    const rel = testsIdx.codeIds?.[id]
    const p = absUnder(testsRoot, rel)
    if (!p) throw new Error(`Unknown testcase id ${id} — update base-tests/registries/tests-index.json`)
    return { kind: 'testcase', id, paths: [p], notes }
  }

  // Screen / API / UI code folder on docs
  if (/^(W|API|UI)-/i.test(id) || /^[a-z]+-[a-z]+-\d{3}(-\d{2,3})+$/i.test(id)) {
    if (mode === 'testcase') {
      const screenRel = testsIdx.codeIds?.[id] || `cases/${id}`
      const screenDir = absUnder(testsRoot, screenRel)
      if (!screenDir) throw new Error(`No cases folder for ${id} under base-tests`)
      const paths = readdirSync(screenDir)
        .filter((f) => /^TC-.*\.ya?ml$/i.test(f))
        .map((f) => path.join(screenDir, f))
        .sort()
      if (!paths.length) throw new Error(`No TC-*.yaml under ${screenDir}`)
      return { kind: 'screen-cases', id, paths, notes }
    }
    // codegen / api-codegen
    const rel = docsIdx.codeIds?.[id]
    if (!rel) throw new Error(`Unknown code id ${id} in base-docs registries/docs-index.json`)
    const codeDir = absUnder(docsRoot, rel)
    if (mode === 'api-codegen') {
      const leaf = leafDirFromCodePath(codeDir)
      const paths = listBackendSpecFiles(leaf)
      if (!paths.length) {
        throw new Error(
          `Missing 01-backend-spec.yaml under ${leaf} (expected …/api/<seq>/). BE does not read ir/design.yaml.`,
        )
      }
      notes.push(`api-codegen input: ${paths.map((p) => path.relative(repoRoot, p)).join(', ')}`)
      return { kind: 'api-spec', id, paths, notes, codeDir: leaf }
    }
    const spec = preferFeDesign(codeDir)
    if (!spec) {
      throw new Error(
        `Missing ir/design.yaml under ${rel}. Split must emit design (tech); ir/spec.yaml is prose only.`,
      )
    }
    notes.push(`codegen input: ${path.relative(repoRoot, spec)}`)
    return { kind: 'code', id, paths: [spec], notes, codeDir }
  }

  // Cluster, Module, or Submodule (e.g. CMP-ADM, CMP-ADM-001, CMP-ADM-001-A)
  if (/^[A-Z]+-[A-Z]+(?:-\d{3})?(?:-[A-Z0-9]+)?$/i.test(id)) {
    const matchedModules = (docsIdx.modules || []).filter(
      (c) => c.id === id || c.id.startsWith(`${id}-`) || c.id.startsWith(id) || (c.slug && id.toLowerCase().includes(c.slug)),
    )
    if (!matchedModules.length) throw new Error(`Unknown cluster/module ${id}`)
    const paths = []
    if (mode === 'testcase') {
      for (const mod of matchedModules) {
        for (const cid of mod.codeIds || []) {
          if (!/^(W|UI)-/i.test(cid)) continue
          const sub = resolveHubId(repoRoot, cid, 'testcase')
          paths.push(...sub.paths)
          notes.push(...sub.notes)
        }
      }
      return { kind: 'module-cases', id, paths, notes }
    }
    for (const mod of matchedModules) {
      const cmpDir = mod.path ? absUnder(docsRoot, mod.path) : findCmpFolder(docsRoot, mod.id)
      if (mode === 'api-codegen') {
        if (cmpDir) {
          const found = listBackendSpecFiles(cmpDir)
          paths.push(...found)
        }
        continue
      }
      for (const cid of mod.codeIds || []) {
        if (mode === 'api-codegen' && /^(W|UI)-/i.test(cid)) {
          notes.push(`skip UI/Web ${cid} for api:gen (BE codegen); design lives in docs hub`)
          continue
        }
        if (mode === 'codegen' && /^API-/i.test(cid)) {
          notes.push(`skip API ${cid} for portal:gen (FE codegen); design lives in docs hub`)
          continue
        }
        try {
          const sub = resolveHubId(repoRoot, cid, mode)
          paths.push(...sub.paths)
          notes.push(...sub.notes)
        } catch (e) {
          notes.push(String(e.message || e))
        }
      }
    }
    if (!paths.length) {
      if (mode === 'api-codegen') {
        throw new Error(`Cluster/Module ${id}: no 01-backend-spec.yaml (BE input is not ir/design.yaml)`)
      }
      throw new Error(`Cluster/Module ${id}: no ir/design.yaml after /grill-dev + spec:split`)
    }
    return { kind: mode === 'api-codegen' ? 'module-api' : 'module-code', id, paths, notes }
  }

  // SC-* scenario → cases listed in tests index
  if (/^SC-/i.test(id)) {
    const sc = testsIdx.scenarios?.[id]
    if (!sc?.cases?.length) {
      throw new Error(`Unknown scenario ${id} — add scenarios.${id}.cases in tests-index.json`)
    }
    const paths = []
    for (const cid of sc.cases) {
      const sub = resolveHubId(repoRoot, cid, 'testcase')
      paths.push(...sub.paths)
    }
    return { kind: 'scenario', id, paths, notes }
  }

  throw new Error(
    `Unrecognized id "${id}". Use W-|API-|UI-|TC-|SC-* or hierarchical ID (e.g. cmp-adm-001-01-01), or module ID (CMP-ADM-001), or suite id (smoke, regression-auth).`,
  )
}
