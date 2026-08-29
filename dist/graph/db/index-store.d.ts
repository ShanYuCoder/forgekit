/**
 * Local index store (SQLite via node:sqlite — Node 22+).
 *
 * Purpose:
 * - Cache registry entries + last analyze gaps for fast MCP tool responses
 * - Store "confirm memory" (member chose mark B for entity X) so next bullet
 *   analyze can raise confidence WITHOUT sending chat history to the cloud
 *
 * NOT a SSOT — registries/*.json and specs in git remain source of truth.
 * Rebuild anytime from disk.
 */
import type { Gap } from '../types.js';
export interface ApiRouteRow {
    route_path: string;
    method: string;
    action: string;
    source_file: string;
    surface: string;
}
export declare class IndexStore {
    private db;
    /**
     * @param repoRoot Absolute path to the product repo that owns .artifactgraph/
     */
    constructor(repoRoot: string);
    /** Create tables if missing — keep schema tiny for v0.1. */
    private migrate;
    /** Upsert one registry row (e.g. design shell DataListPage). */
    upsertRegistryEntry(registry: string, entryId: string, payload: unknown): void;
    /** Clear one registry namespace before full rebuild. */
    clearRegistry(registry: string): void;
    /** Run a rebuild atomically so parse/index failures cannot leave partial state. */
    transaction<T>(work: () => T): T;
    listRegistryEntries(registry: string): Array<{
        entryId: string;
        payload: unknown;
    }>;
    /**
     * Remember a grill confirm so later bullet-analyze can reuse it.
     * Example subject: "entity:hotel|column:status" → needs-component MoStatusChip
     */
    rememberDecision(kind: string, subject: string, payload: unknown): void;
    findDecisions(subjectPrefix: string): Array<{
        kind: string;
        subject: string;
        payload: unknown;
    }>;
    findDecisionsByKind(kind: string): Array<{
        kind: string;
        subject: string;
        payload: unknown;
    }>;
    saveGapSnapshot(specPath: string | undefined, gaps: Gap[]): void;
    setMeta(key: string, value: string): void;
    getMeta(key: string): string | undefined;
    close(): void;
    /** Replace all API routes (call before re-indexing). */
    clearApiRoutes(): void;
    /** Upsert one API route row (path+method = logical key; duplicates are kept for cross-file comparison). */
    insertApiRoute(entry: ApiRouteRow): void;
    /** Find routes by path prefix/exact and optional method filter. */
    findApiRoutes(pathPattern: string, method?: string): ApiRouteRow[];
    /** Load all indexed routes (for duplicate detection). */
    listAllApiRoutes(): ApiRouteRow[];
    /** Count of indexed API routes (for rebuild summary). */
    countApiRoutes(): number;
}
