/**
 * Load product registries into memory (+ optional IndexStore upsert).
 *
 * Registries live under product `registries/*.json`.
 */
import type { ArtifactgraphConfig } from '../types.js';
import type { IndexStore } from '../db/index-store.js';
export interface LoadedRegistries {
    /** basename → parsed JSON */
    byFile: Record<string, unknown>;
    /** Flattened design shells / common ids for matching. */
    designShells: string[];
    commonIds: string[];
    unitPatterns: string[];
    e2eBundles: string[];
    aliasToCanonical: Record<string, string>;
    codeIds: Record<string, string>;
}
/** Read all configured registry files from a product repo. */
export declare function loadRegistries(repoRoot: string, cfg: ArtifactgraphConfig): LoadedRegistries;
/** Counts returned to MCP status / rebuild (DSL index summary). */
export declare function registryIndexSummary(loaded: LoadedRegistries, apiRoutesCount?: number): Record<string, number>;
/**
 * Push registry keys into SQLite for later retrieve.
 * Index only — product `registries/*.json` remain SSOT (never written by this MCP).
 */
export declare function indexRegistries(store: IndexStore, loaded: LoadedRegistries, repoRoot?: string, cfg?: ArtifactgraphConfig): void;
