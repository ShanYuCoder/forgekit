import { type OwnedGitignoreEntry } from './gitignore.js';
/**
 * Machine-local checkout maps (create-if-missing only).
 *
 * SSOT for every toolkit `init`: Docskit / Processkit… import this
 * helper so install order never gates cross-repo maps. Never seeds portable
 * `platform-repos.json` / `legacy-repos.json`.
 */
export declare const PLATFORM_LOCAL_MAP = "platform-repos.local.json";
export declare const LEGACY_LOCAL_MAP = "legacy-repos.local.json";
export declare const LOCAL_MAP_FILES: readonly ["platform-repos.local.json", "legacy-repos.local.json"];
export type RepoMapKind = 'platform' | 'legacy';
export interface EnsureLocalRepoMapsResult {
    created: string[];
    skipped: string[];
    /** Shared gitignore entries ensured for both local maps. */
    gitignoreEntries: OwnedGitignoreEntry[];
    gitignoreAdded: string[];
}
export interface LocalMapStatus {
    file: string;
    exists: boolean;
    /** True when the file is missing or `projects` has no keys. */
    empty: boolean;
    projectCount: number;
}
/**
 * Route a system id to the correct machine-local map.
 * `legacy-*` → legacy map; everything else → platform.
 */
export declare function mapKindForSystemId(systemId: string): RepoMapKind;
export declare function localMapFileForSystemId(systemId: string): (typeof LOCAL_MAP_FILES)[number];
/**
 * Create `platform-repos.local.json` and `legacy-repos.local.json` when missing.
 * Existing files are never overwritten, merged, or normalized (member content
 * and CRLF are preserved by not touching the file).
 *
 * Both ignore patterns are **shared**: any toolkit may ensure them; deinit of
 * one toolkit must not strip the lines while others still rely on the maps.
 */
export declare function ensureLocalRepoMaps(root: string): EnsureLocalRepoMapsResult;
/** Status slice for toolkit `status` — missing/empty maps for cross-repo. */
export declare function localMapsStatus(root: string): LocalMapStatus[];
