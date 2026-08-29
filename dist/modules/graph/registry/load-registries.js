/**
 * Load product registries into memory (+ optional IndexStore upsert).
 *
 * Registries live under product `registries/*.json`.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { indexApiRoutes } from '../analyze/api-routes.js';
/** Read all configured registry files from a product repo. */
export function loadRegistries(repoRoot, cfg) {
    const byFile = {};
    const designShells = [];
    const commonIds = [];
    const unitPatterns = [];
    const e2eBundles = [];
    const aliasToCanonical = {};
    const codeIds = {};
    for (const rel of cfg.registries ?? []) {
        const abs = path.join(repoRoot, rel);
        if (!existsSync(abs))
            continue;
        const data = JSON.parse(readFileSync(abs, 'utf8'));
        const base = path.basename(rel);
        byFile[base] = data;
        if (base.includes('design')) {
            const shells = (data.shells ?? {});
            for (const [id, shell] of Object.entries(shells)) {
                designShells.push(id);
                aliasToCanonical[id.toLowerCase()] = id;
                for (const a of shell.aliases?.informal ?? []) {
                    aliasToCanonical[String(a).toLowerCase()] = id;
                }
            }
            const aliasIndex = (data.aliasIndex ?? {});
            for (const [k, v] of Object.entries(aliasIndex)) {
                aliasToCanonical[k.toLowerCase()] = v;
            }
        }
        if (base.includes('common')) {
            const entries = (data.entries ?? {});
            commonIds.push(...Object.keys(entries));
        }
        if (base.includes('unit-test')) {
            const patterns = (data.patterns ?? {});
            unitPatterns.push(...Object.keys(patterns));
        }
        if (base.includes('e2e')) {
            const bundles = (data.bundles ?? {});
            e2eBundles.push(...Object.keys(bundles));
        }
        if (base.includes('docs-index')) {
            const ids = (data.codeIds ?? {});
            Object.assign(codeIds, ids);
        }
    }
    return { byFile, designShells, commonIds, unitPatterns, e2eBundles, aliasToCanonical, codeIds };
}
/** Counts returned to MCP status / rebuild (DSL index summary). */
export function registryIndexSummary(loaded, apiRoutesCount) {
    return {
        files: Object.keys(loaded.byFile).length,
        designShells: loaded.designShells.length,
        commonIds: loaded.commonIds.length,
        unitPatterns: loaded.unitPatterns.length,
        e2eBundles: loaded.e2eBundles.length,
        aliases: Object.keys(loaded.aliasToCanonical).length,
        codeIds: Object.keys(loaded.codeIds).length,
        apiRoutes: apiRoutesCount ?? 0,
    };
}
/**
 * Push registry keys into SQLite for later retrieve.
 * Index only — product `registries/*.json` remain SSOT (never written by this MCP).
 */
export function indexRegistries(store, loaded, repoRoot, cfg) {
    for (const [file, data] of Object.entries(loaded.byFile)) {
        store.clearRegistry(file);
        store.upsertRegistryEntry(file, '_root', data);
    }
    store.clearRegistry('design.shells');
    for (const id of loaded.designShells) {
        store.upsertRegistryEntry('design.shells', id, { id });
    }
    store.clearRegistry('common.entries');
    for (const id of loaded.commonIds) {
        store.upsertRegistryEntry('common.entries', id, { id });
    }
    store.clearRegistry('unit.patterns');
    for (const id of loaded.unitPatterns) {
        store.upsertRegistryEntry('unit.patterns', id, { id });
    }
    store.clearRegistry('e2e.bundles');
    for (const id of loaded.e2eBundles) {
        store.upsertRegistryEntry('e2e.bundles', id, { id });
    }
    store.clearRegistry('alias');
    for (const [alias, canonical] of Object.entries(loaded.aliasToCanonical)) {
        store.upsertRegistryEntry('alias', alias, { canonical });
    }
    store.clearRegistry('code.ids');
    for (const [id, pathHint] of Object.entries(loaded.codeIds)) {
        store.upsertRegistryEntry('code.ids', id, { pathHint });
    }
    // Index API routes from OpenAPI / backend-spec YAML files
    if (repoRoot && cfg) {
        indexApiRoutes(store, repoRoot, cfg);
    }
    store.setMeta('rebuiltAt', new Date().toISOString());
    store.setMeta('indexSummary', JSON.stringify(registryIndexSummary(loaded, repoRoot && cfg ? store.countApiRoutes() : 0)));
}
//# sourceMappingURL=load-registries.js.map