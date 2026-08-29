import { readFile } from 'node:fs/promises'
import path from 'node:path'

const MANIFEST_NAME = 'codegen.manifest.json'

/**
 * @param {string} featureDir absolute or relative feature directory
 */
export async function readCodegenManifest(featureDir) {
  const manifestPath = path.join(featureDir, 'generated', MANIFEST_NAME)
  let raw

  try {
    raw = await readFile(manifestPath, 'utf8')
  } catch {
    throw new Error(
      `Missing ${path.join(featureDir, 'generated', MANIFEST_NAME)} — run codegenkit gen --id … first (manifest under docs hub …/code/{W-…}/generated/)`
    )
  }

  const manifest = JSON.parse(raw)
  if (!manifest.profile || !manifest.entity) {
    throw new Error(`Invalid codegen manifest at ${manifestPath}`)
  }

  return { manifest, manifestPath }
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {string} layer
 */
export function findManifestLayerPath(manifest, layer, opts = {}) {
  const files = manifest.files ?? []
  const hits = files.filter((f) => f.layer === layer)
  const needle = opts.pathIncludes
  if (needle) {
    const hit = hits.find((f) => String(f.path ?? '').includes(needle))
    if (hit?.path) return hit.path
  }
  return hits[0]?.path ?? null
}
