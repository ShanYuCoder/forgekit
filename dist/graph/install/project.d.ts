import { type OwnedGitignoreEntry } from './gitignore.js';
import { type AgentId } from './agents.js';
export type { OwnedGitignoreEntry } from './gitignore.js';
export type InstallType = 'common' | 'docs' | 'fe' | 'be' | 'test' | 'all';
export declare const INSTALL_MANIFEST_SCHEMA_VERSION = 1;
export declare const INSTALL_MANIFEST_PACKAGE = "@platform/artifactgraph";
export declare const INSTALL_MANIFEST_TOOL_API = 1;
export declare const INSTALL_MANIFEST_HARNESS_API = 1;
export interface ManagedFile {
    source: string;
    hash: string;
    stale?: boolean;
}
export interface InstallManifest {
    schemaVersion: 1;
    package: '@platform/artifactgraph';
    toolApi: 1;
    harnessApi: 1;
    packageVersion: string;
    types: InstallType[];
    files: Record<string, ManagedFile>;
    gitignore?: OwnedGitignoreEntry[];
}
export type InstallManifestCompatibility = 'not-installed' | 'supported' | 'legacy' | 'incompatible';
export interface ProjectInstallResult {
    root: string;
    types: InstallType[];
    configPath: string;
    created: string[];
    updated: string[];
    skipped: string[];
    conflicts: string[];
    manifestPath: string;
    gitignore: {
        file: string;
        changed: boolean;
        entries: OwnedGitignoreEntry[];
        added: string[];
    };
}
export interface GitignoreEntryStatus {
    pattern: string;
    shared: boolean;
    present: boolean;
}
export interface ProjectInstallStatus {
    installed: boolean;
    manifestPath: string;
    compatibility: InstallManifestCompatibility;
    compatible: boolean;
    legacy: boolean;
    warnings: string[];
    compatibilityError?: string;
    schemaVersion?: number;
    package?: string;
    toolApi?: number;
    harnessApi?: number;
    packageVersion?: string;
    types: InstallType[];
    healthy: string[];
    missing: string[];
    modified: string[];
    stale: {
        healthy: string[];
        missing: string[];
        modified: string[];
    };
    gitignore: GitignoreEntryStatus[];
}
export interface ProjectPruneResult {
    root: string;
    manifestPath: string;
    dryRun: boolean;
    wouldDelete: string[];
    deleted: string[];
    missing: string[];
    preservedModified: string[];
    preservedUnsafe: string[];
}
export interface ProjectUninstallResult {
    root: string;
    manifestPath: string;
    dryRun: boolean;
    wouldDelete: string[];
    deleted: string[];
    missing: string[];
    preservedModified: string[];
    preservedUnsafe: string[];
    manifestRemoved: boolean;
    gitignoreRemoved: string[];
    gitignorePreservedShared: string[];
}
export declare function normalizeInstallTypes(types: InstallType[]): InstallType[];
export declare function parseInstallTypes(raw?: string): InstallType[];
export interface LegacyInstallManifest {
    version: 1;
    packageVersion: '2.0.0';
    types: InstallType[];
    files: Record<string, ManagedFile>;
}
export declare function assertProjectManifestCompatible(repoRoot: string): InstallManifest | LegacyInstallManifest | null;
export declare function projectInstallStatus(repoRoot: string): ProjectInstallStatus;
export declare function pruneProjectAssets(opts: {
    repoRoot: string;
    yes?: boolean;
}): ProjectPruneResult;
/**
 * Remove all manifest-owned harness assets, including stale entries.
 * Modified and unsafe files are preserved and reported.
 */
export declare function uninstallProjectAssets(opts: {
    repoRoot: string;
    yes?: boolean;
}): ProjectUninstallResult;
export declare function installProjectAssets(opts: {
    repoRoot: string;
    stack: string;
    types: InstallType[];
    force?: boolean;
    /** Absolute local agent config paths written by this init (local only). */
    writtenAgentPaths?: string[];
    agents?: AgentId[];
}): ProjectInstallResult;
