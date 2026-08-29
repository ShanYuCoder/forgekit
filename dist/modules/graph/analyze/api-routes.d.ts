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
import type { ArtifactgraphConfig } from '../types.js';
import type { IndexStore } from '../db/index-store.js';
export interface ApiRouteEntry {
    /** URI path, e.g. /api/v1/users/{id}/update */
    path: string;
    /** HTTP method, uppercased: GET | POST | PUT | PATCH | DELETE */
    method: string;
    /** Action derived from URI suffix or operation ID: create | update | detail | delete | duplicate | list */
    action: string;
    /** Relative source file path from repo root */
    sourceFile: string;
    /** Surface / module id (derived from directory structure) */
    surface: string;
}
export interface DuplicateRouteConflict {
    path: string;
    method: string;
    /** All source files that define this path+method */
    sources: string[];
}
/**
 * Parse one spec file → array of ApiRouteEntry.
 * Handles both OpenAPI `paths:` and custom `routes:` / `endpoints:` formats.
 */
export declare function parseSpecFile(absPath: string, repoRoot: string): ApiRouteEntry[];
/**
 * Scan product repo for API spec YAML files, parse routes, insert into SQLite.
 * Returns total route count indexed.
 */
export declare function indexApiRoutes(store: IndexStore, repoRoot: string, cfg: ArtifactgraphConfig): number;
/**
 * Find API routes matching path + optional method/entity.
 * Uses SQLite index when fresh; scans on-demand as fallback.
 */
export declare function findApiRoutes(store: IndexStore, repoRoot: string, cfg: ArtifactgraphConfig, opts: {
    path: string;
    method?: string;
    entity?: string;
}): ApiRouteEntry[];
/** Scan all spec YAML files directly without using the index. */
export declare function scanApiRoutesDirect(repoRoot: string, cfg: ArtifactgraphConfig): ApiRouteEntry[];
/**
 * Given a list of routes, return any path+method that appears in more than one
 * source file (structural conflict candidates).
 */
export declare function detectDuplicateRoutes(routes: ApiRouteEntry[]): DuplicateRouteConflict[];
/**
 * Load all currently indexed routes (or scan on-demand if stale).
 * Convenience wrapper for grill_check duplicate detection.
 */
export declare function loadAllApiRoutes(store: IndexStore, repoRoot: string, cfg: ArtifactgraphConfig): ApiRouteEntry[];
