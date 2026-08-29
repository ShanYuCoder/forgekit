import { resolveHubId } from './resolve-hub-id.mjs'

const [,, repoRoot, id, mode] = process.argv

if (!repoRoot || !id || !mode) {
  console.error(JSON.stringify({ success: false, error: 'Usage: resolve-cli.mjs <repoRoot> <id> <mode>' }))
  process.exit(1)
}

try {
  const resolved = resolveHubId(repoRoot, id, mode)
  console.log(JSON.stringify({ success: true, paths: resolved.paths, notes: resolved.notes, kind: resolved.kind }))
} catch (e) {
  console.error(JSON.stringify({ success: false, error: e.message }))
  process.exit(1)
}
