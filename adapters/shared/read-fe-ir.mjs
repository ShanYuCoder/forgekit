import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'
import { assertFeProfileMatchesRoute } from './fe-layout-profiles.mjs'

export function resolveFeatureDir(specPath) {
  const absolute = path.resolve(specPath)
  const dir = path.dirname(absolute)
  if (path.basename(dir) === 'ir') return path.dirname(dir)
  return dir
}

/** Reject ir/spec.yaml — tech consumers must pass ir/design.yaml. */
export function requireDesignIrPath(inputPath) {
  const absolute = path.resolve(inputPath)
  const name = path.basename(absolute)
  if (name === 'spec.yaml' || name === 'spec.yml') {
    throw new Error(
      `ir/spec.yaml is business prose only. Pass ir/design.yaml (${path.join(path.dirname(absolute), 'design.yaml')}). Missing design means split/spec is incomplete.`,
    )
  }
  if (name !== 'design.yaml') {
    throw new Error(`Expected ir/design.yaml, got ${absolute}`)
  }
  return absolute
}

/** @deprecated use requireDesignIrPath */
export function resolveFeIrPath(inputPath) {
  return requireDesignIrPath(inputPath)
}

async function parseYaml(filePath) {
  const raw = await readFile(filePath, 'utf8')
  return parse(raw) ?? {}
}

/**
 * Load ir/design.yaml only. No sibling spec merge, no spec.yaml fallback.
 */
export async function readFeIrFile(irPath) {
  const absolute = requireDesignIrPath(irPath)
  const spec = await parseYaml(absolute)

  if (!spec.codegen?.profile) {
    throw new Error(
      `Missing codegen.profile in ${absolute}. Patch bundle.gen then pnpm spec:split so ir/design.yaml is complete.`,
    )
  }
  const routePath = spec.ui?.routes?.[0]?.path
  assertFeProfileMatchesRoute(spec.codegen.profile, routePath)

  return {
    spec,
    specFile: path.relative(process.cwd(), absolute),
    featureDir: resolveFeatureDir(absolute)
  }
}

/** Unused by FE/BE gen. Kept for callers that still pass an explicit yaml path. */
export async function readSpecFile(specPath) {
  return readFeIrFile(specPath)
}
