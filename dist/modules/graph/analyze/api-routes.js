/**
 * API Route Indexer — scan, index, and query OpenAPI / backend-spec YAML files.
 *
 * Responsibilities:
 * - Glob product repo for `01-backend-spec.yaml` / `02-openapi.yaml` files
 * - Parse `paths:` (OpenAPI 3.x standard) + `routes:` / `endpoints:` (custom format)
 * - Upsert into SQLite `api_route` table via IndexStore
 * - Expose query (index-first, on-demand fallback) + duplicate detector
 *
 * Strategy (hybrid):
 *   1. If SQLite index is fresh (< 24h) → use index
 *   2. If index is empty / stale → on-demand glob scan → also write back to index
 *
 * SSOT: product repo YAML files. MCP indexes only — never owns specs.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { inferSurfaceFromRepoPath } from './product-paths.js';
// ---------------------------------------------------------------------------
// Glob helpers (no external glob library — use recursive readdir)
// ---------------------------------------------------------------------------
const API_SPEC_FILENAMES = new Set(['01-backend-spec.yaml', '02-openapi.yaml', 'openapi.yaml']);
const INDEX_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
function walkForSpecs(dir, collected) {
    if (!existsSync(dir))
        return;
    let entries;
    try {
        entries = readdirSync(dir);
    }
    catch {
        return;
    }
    for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'node_modules')
            continue;
        const full = path.join(dir, entry);
        let st;
        try {
            st = statSync(full);
        }
        catch {
            continue;
        }
        if (st.isDirectory()) {
            walkForSpecs(full, collected);
        }
        else if (st.isFile() && API_SPEC_FILENAMES.has(entry)) {
            collected.push(full);
        }
    }
}
function resolveSpecGlobs(repoRoot, cfg) {
    const collected = [];
    // Use explicit apiSpecRoots if configured
    if (cfg.apiSpecRoots?.length) {
        for (const rel of cfg.apiSpecRoots) {
            // Treat as prefix directories (strip ** glob suffix) for our simple walker
            const baseDir = rel.split('*')[0].replace(/\/$/, '');
            if (baseDir)
                walkForSpecs(path.join(repoRoot, baseDir), collected);
        }
        return [...new Set(collected)];
    }
    // Derive from specRoots — walk those dirs and filter by filename
    if (cfg.specRoots?.length) {
        for (const rel of cfg.specRoots) {
            const baseDir = rel.split('*')[0].replace(/\/$/, '');
            if (baseDir)
                walkForSpecs(path.join(repoRoot, baseDir), collected);
        }
        return [...new Set(collected)];
    }
    // Last resort: walk common product surfaces path
    walkForSpecs(path.join(repoRoot, 'product', 'surfaces'), collected);
    return [...new Set(collected)];
}
// ---------------------------------------------------------------------------
// YAML parsers — handle both OpenAPI 3.x and custom backend-spec formats
// ---------------------------------------------------------------------------
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
/** Infer action from URI path suffix or operation verb. */
function inferAction(uriPath, method, operationId) {
    if (operationId) {
        const lower = operationId.toLowerCase();
        if (lower.includes('create') || lower.includes('store'))
            return 'create';
        if (lower.includes('update') || lower.includes('edit'))
            return 'update';
        if (lower.includes('delete') || lower.includes('destroy') || lower.includes('remove'))
            return 'delete';
        if (lower.includes('duplicate') || lower.includes('clone') || lower.includes('copy'))
            return 'duplicate';
        if (lower.includes('detail') || lower.includes('show') || lower.includes('get'))
            return 'detail';
        if (lower.includes('list') || lower.includes('index'))
            return 'list';
    }
    // Derive from URI suffix
    const segments = uriPath.split('/').filter(Boolean);
    const last = segments[segments.length - 1] ?? '';
    if (!last)
        return method === 'get' ? 'list' : '';
    if (last === 'create' || last === 'store')
        return 'create';
    if (last === 'update' || last === 'edit')
        return 'update';
    if (last === 'delete' || last === 'destroy')
        return 'delete';
    if (last === 'duplicate' || last === 'clone')
        return 'duplicate';
    if (last === 'detail' || last === 'show')
        return 'detail';
    if (/^\{.+\}$/.test(last)) {
        // {id} — infer from method
        if (method === 'get')
            return 'detail';
        if (method === 'put' || method === 'patch')
            return 'update';
        if (method === 'delete')
            return 'delete';
    }
    if (method === 'post')
        return 'create';
    if (method === 'get')
        return 'list';
    return '';
}
/** Extract surface/module id from file path heuristics (canonical + legacy). */
function inferSurface(absPath, repoRoot) {
    return inferSurfaceFromRepoPath(absPath, repoRoot);
}
/**
 * Parse one spec file → array of ApiRouteEntry.
 * Handles both OpenAPI `paths:` and custom `routes:` / `endpoints:` formats.
 */
export function parseSpecFile(absPath, repoRoot) {
    let raw;
    try {
        raw = readFileSync(absPath, 'utf8');
    }
    catch {
        return [];
    }
    let doc;
    try {
        doc = parseYaml(raw);
    }
    catch {
        return [];
    }
    if (!doc || typeof doc !== 'object')
        return [];
    const sourceFile = path.relative(repoRoot, absPath);
    const surface = inferSurface(absPath, repoRoot);
    const entries = [];
    // --- OpenAPI 3.x: paths: { '/foo': { get: { operationId, ... } } }
    const openApiPaths = doc['paths'];
    if (openApiPaths && typeof openApiPaths === 'object') {
        for (const [uriPath, pathItem] of Object.entries(openApiPaths)) {
            if (!pathItem || typeof pathItem !== 'object')
                continue;
            for (const method of HTTP_METHODS) {
                const op = pathItem[method];
                if (!op)
                    continue;
                entries.push({
                    path: uriPath,
                    method: method.toUpperCase(),
                    action: inferAction(uriPath, method, op['operationId']),
                    sourceFile,
                    surface,
                });
            }
        }
        return entries;
    }
    // --- Custom backend-spec format: routes: [{ method, path, action, ... }]
    const customRoutes = doc['routes'];
    if (Array.isArray(customRoutes)) {
        for (const r of customRoutes) {
            const uriPath = String(r['path'] ?? r['uri'] ?? '');
            const method = String(r['method'] ?? 'GET').toUpperCase();
            if (!uriPath)
                continue;
            entries.push({
                path: uriPath,
                method,
                action: String(r['action'] ?? inferAction(uriPath, method.toLowerCase())),
                sourceFile,
                surface,
            });
        }
        return entries;
    }
    // --- Custom backend-spec format: endpoints: [{ method, path, ... }]
    const customEndpoints = doc['endpoints'];
    if (Array.isArray(customEndpoints)) {
        for (const ep of customEndpoints) {
            const uriPath = String(ep['path'] ?? ep['url'] ?? '');
            const method = String(ep['method'] ?? 'GET').toUpperCase();
            if (!uriPath)
                continue;
            entries.push({
                path: uriPath,
                method,
                action: String(ep['action'] ?? inferAction(uriPath, method.toLowerCase())),
                sourceFile,
                surface,
            });
        }
    }
    return entries;
}
// ---------------------------------------------------------------------------
// Index (rebuild)
// ---------------------------------------------------------------------------
/**
 * Scan product repo for API spec YAML files, parse routes, insert into SQLite.
 * Returns total route count indexed.
 */
export function indexApiRoutes(store, repoRoot, cfg) {
    const specFiles = resolveSpecGlobs(repoRoot, cfg);
    store.clearApiRoutes();
    let count = 0;
    for (const absPath of specFiles) {
        const parsed = parseSpecFile(absPath, repoRoot);
        for (const entry of parsed) {
            store.insertApiRoute({
                route_path: entry.path,
                method: entry.method,
                action: entry.action,
                source_file: entry.sourceFile,
                surface: entry.surface,
            });
            count++;
        }
    }
    store.setMeta('apiRoutesIndexedAt', new Date().toISOString());
    store.setMeta('apiRoutesCount', String(count));
    return count;
}
// ---------------------------------------------------------------------------
// Query (hybrid: index first, fallback on-demand scan)
// ---------------------------------------------------------------------------
function isIndexFresh(store) {
    const indexedAt = store.getMeta('apiRoutesIndexedAt');
    if (!indexedAt)
        return false;
    const age = Date.now() - new Date(indexedAt).getTime();
    return age < INDEX_MAX_AGE_MS;
}
function rowToEntry(row) {
    return {
        path: row.route_path,
        method: row.method,
        action: row.action,
        sourceFile: row.source_file,
        surface: row.surface,
    };
}
/**
 * Find API routes matching path + optional method/entity.
 * Uses SQLite index when fresh; scans on-demand as fallback.
 */
export function findApiRoutes(store, repoRoot, cfg, opts) {
    const useIndex = isIndexFresh(store) && store.countApiRoutes() > 0;
    let rows;
    if (useIndex) {
        // Exact match first
        rows = store.findApiRoutes(opts.path, opts.method);
        // If no exact match, try prefix (path without trailing action segment)
        if (rows.length === 0 && opts.path.includes('/')) {
            const prefix = opts.path.replace(/\/[^/]+$/, '') + '%';
            rows = store.findApiRoutes(prefix, opts.method);
        }
    }
    else {
        // On-demand scan (also writes back to index)
        const all = scanApiRoutesDirect(repoRoot, cfg);
        store.clearApiRoutes();
        for (const e of all) {
            store.insertApiRoute({
                route_path: e.path,
                method: e.method,
                action: e.action,
                source_file: e.sourceFile,
                surface: e.surface,
            });
        }
        store.setMeta('apiRoutesIndexedAt', new Date().toISOString());
        store.setMeta('apiRoutesCount', String(all.length));
        rows = all
            .filter((e) => {
            const pathMatch = e.path === opts.path || e.path.startsWith(opts.path.replace(/\/[^/]+$/, ''));
            const methodMatch = !opts.method || e.method === opts.method.toUpperCase();
            return pathMatch && methodMatch;
        })
            .map((e) => ({
            route_path: e.path,
            method: e.method,
            action: e.action,
            source_file: e.sourceFile,
            surface: e.surface,
        }));
    }
    let results = rows.map(rowToEntry);
    // Entity fuzzy match — filter by entity name in path
    if (opts.entity && results.length === 0) {
        const entityLower = opts.entity.toLowerCase();
        const allRows = store.listAllApiRoutes();
        results = allRows
            .filter((r) => r.route_path.toLowerCase().includes(entityLower))
            .map(rowToEntry);
    }
    return results;
}
// ---------------------------------------------------------------------------
// On-demand scan (stateless)
// ---------------------------------------------------------------------------
/** Scan all spec YAML files directly without using the index. */
export function scanApiRoutesDirect(repoRoot, cfg) {
    const specFiles = resolveSpecGlobs(repoRoot, cfg);
    const all = [];
    for (const f of specFiles) {
        all.push(...parseSpecFile(f, repoRoot));
    }
    return all;
}
// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------
/**
 * Given a list of routes, return any path+method that appears in more than one
 * source file (structural conflict candidates).
 */
export function detectDuplicateRoutes(routes) {
    const map = new Map();
    for (const r of routes) {
        const key = `${r.method}:${r.path}`;
        if (!map.has(key))
            map.set(key, new Set());
        map.get(key).add(r.sourceFile);
    }
    const conflicts = [];
    for (const [key, sources] of map.entries()) {
        if (sources.size > 1) {
            const [method, ...pathParts] = key.split(':');
            conflicts.push({
                path: pathParts.join(':'),
                method: method,
                sources: [...sources],
            });
        }
    }
    return conflicts;
}
/**
 * Load all currently indexed routes (or scan on-demand if stale).
 * Convenience wrapper for grill_check duplicate detection.
 */
export function loadAllApiRoutes(store, repoRoot, cfg) {
    const useIndex = isIndexFresh(store) && store.countApiRoutes() > 0;
    if (useIndex) {
        return store.listAllApiRoutes().map(rowToEntry);
    }
    return scanApiRoutesDirect(repoRoot, cfg);
}
//# sourceMappingURL=api-routes.js.map