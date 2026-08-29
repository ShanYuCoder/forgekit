import { type ProfileType } from '../config/project-root.js';
import type { SeededProjectMap } from './maps.js';
import { type OwnedGitignoreEntry } from './gitignore.js';
import { type LocalMapStatus } from './local-maps.js';
import { type AgentId } from './agents.js';
export interface InstallManifestFile {
    source: string;
    sha256: string;
    state: 'active' | 'stale';
}
export interface InstallManifestMcp {
    file: string;
    servers: Record<string, {
        sha256: string;
    }>;
}
export interface InstallManifest {
    schemaVersion: 1;
    package: '@platform/platform-dna';
    packageVersion: string;
    type: ProfileType;
    harnessApi: 1;
    files: Record<string, InstallManifestFile>;
    maps?: Record<string, {
        sha256: string;
    }>;
    /** Exact `.gitignore` entries Platform DNA ensured, with shared-ownership. */
    gitignore?: OwnedGitignoreEntry[];
    /** Owned MCP server entries, so `status` can verify and `deinit` can unwire. */
    mcp?: InstallManifestMcp;
}
export interface HarnessFileStatus extends InstallManifestFile {
    path: string;
    status: 'unmodified' | 'modified' | 'missing';
    prunable: boolean;
}
export interface GitignoreEntryStatus {
    pattern: string;
    shared: boolean;
    present: boolean;
}
export interface McpServerStatus {
    name: string;
    status: 'unmodified' | 'modified' | 'missing';
}
export interface HarnessStatus {
    manifestPath: string;
    type: ProfileType;
    packageVersion: string;
    files: HarnessFileStatus[];
    gitignore: GitignoreEntryStatus[];
    mcp: McpServerStatus[];
    /** Read-only cross-repo map nag slice; empty maps do not fail status. */
    localMaps: LocalMapStatus[];
}
export interface PruneHarnessResult {
    dryRun: boolean;
    planned: string[];
    deleted: string[];
    skipped: HarnessFileStatus[];
}
export interface UninstallHarnessResult {
    dryRun: boolean;
    wouldDelete: string[];
    deleted: string[];
    preservedModified: string[];
    missing: string[];
    manifestRemoved: boolean;
}
/** Map harness source path → installed agent relative path. */
export declare function harnessSourceToTarget(source: string, agentDir?: string): string;
export declare function validateInstallManifest(value: unknown): InstallManifest;
export declare function readInstallManifest(root: string): InstallManifest | undefined;
export declare function getHarnessStatus(root: string): HarnessStatus;
export declare function pruneHarness(opts: {
    root: string;
    yes?: boolean;
}): PruneHarnessResult;
export declare function installHarness(opts: {
    root: string;
    type: ProfileType;
    adapter?: string;
    feAdapter?: string;
    beAdapter?: string;
    force?: boolean;
    seededMaps?: SeededProjectMap[];
    gitignoreEntries?: OwnedGitignoreEntry[];
    mcp?: InstallManifestMcp;
    targets?: AgentId[];
}): {
    written: string[];
    unchanged: string[];
    conflicts: string[];
};
/**
 * Update only the managed gitignore/MCP metadata on an existing install (used by
 * the idempotent `codegraph:wire` command without re-walking the harness tree).
 */
export declare function recordManagedExtras(root: string, opts: {
    gitignore?: OwnedGitignoreEntry[];
    mcp?: InstallManifestMcp;
}): InstallManifest;
/**
 * Remove only assets proven to be Platform-DNA-owned by the validated manifest.
 * Member-modified files and maps that predated manifest ownership are preserved.
 */
export declare function uninstallHarness(opts: {
    root: string;
    yes?: boolean;
}): UninstallHarnessResult;
