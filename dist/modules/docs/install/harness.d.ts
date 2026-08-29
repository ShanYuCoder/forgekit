import { type OwnedGitignoreEntry } from './gitignore.js';
import { type AgentHarnessProfile } from './agent-profile.js';
export type { OwnedGitignoreEntry } from './gitignore.js';
export declare const INSTALL_MANIFEST_PATH = ".docskit/install-manifest.json";
export declare const INSTALL_MANIFEST_SCHEMA = 1;
export type DocskitHarnessType = 'docs' | 'consumer' | 'be';
/** Skills installed on docs hubs (docs type). */
export declare const DOCSKIT_OWNED_SKILLS_DOCS: readonly ["docskit", "overview", "architecture", "surfaces", "module", "deployment", "decision", "cross-cutting", "business-process", "spec", "update-spec", "qa-resolve", "grill", "grill-docs", "grill-bqa", "grill-dev", "db-erd", "cross-service", "architecture-grill", "build-templates", "openapi"];
/** Skills installed on BE repos (be type). */
export declare const DOCSKIT_OWNED_SKILLS_BE: readonly ["api", "api-spec", "api-update", "api-integration", "grill-api", "grill-api-spec", "grill-integration-spec", "call-external", "cross-entity-service"];
/** @deprecated Use DOCSKIT_OWNED_SKILLS_DOCS or DOCSKIT_OWNED_SKILLS_BE */
export declare const DOCSKIT_OWNED_SKILLS: readonly ["docskit", "overview", "architecture", "surfaces", "module", "deployment", "decision", "cross-cutting", "business-process", "spec", "update-spec", "qa-resolve", "grill", "grill-docs", "grill-bqa", "grill-dev", "db-erd", "cross-service", "architecture-grill", "build-templates", "openapi"];
export interface StaleHarnessAsset {
    hash: string;
    sinceVersion: string;
}
export interface GitignoreEntryStatus {
    pattern: string;
    shared: boolean;
    status: 'present' | 'missing';
}
export interface HarnessInstallManifest {
    package: string;
    schema: number;
    toolApi: number;
    harnessApi: number;
    version: string;
    hashes: Record<string, string>;
    stale: Record<string, StaleHarnessAsset>;
    /** Exact ignore entries Docskit ensured; shared kept on deinit. */
    gitignore?: OwnedGitignoreEntry[];
}
export interface HarnessInstallResult {
    written: string[];
    unchanged: string[];
    skipped: string[];
    stale: string[];
    manifest: string;
    registry?: string[];
}
export interface HarnessStatusResult {
    manifest: string;
    installed: boolean;
    version?: string;
    current: string[];
    modified: string[];
    missing: string[];
    stale: string[];
    staleModified: string[];
    staleMissing: string[];
    gitignore: GitignoreEntryStatus[];
}
export interface HarnessPruneResult {
    manifest: string;
    dryRun: boolean;
    deleted: string[];
    wouldDelete: string[];
    preservedModified: string[];
    missing: string[];
}
export declare function resolveManagedPath(root: string, realRoot: string, rel: string): string;
/**
 * Map a template-relative path to the destination path under one agent dir.
 * AGENTS.md may become CLAUDE.md / GEMINI.md / omitted (Cursor → mdc only).
 */
export declare function mapTemplateRelForAgent(sourceRelPosix: string, profile: AgentHarnessProfile, agentDir: string): string | null;
/** Build managed harness bytes per selected agent (generated, not copy/rename). */
export declare function currentAssetHashes(type: DocskitHarnessType, targets?: string[]): Map<string, {
    content: Buffer;
    hash: string;
}>;
/** Hub-root `qa/open/` inbox. Does not overwrite member QA files. */
export declare function scaffoldQaInbox(root: string): void;
export declare function scaffoldProductSkeleton(root: string): void;
export declare function scaffoldSchemas(root: string): void;
/** Ensure `.harness/` exists for tracking. */
export declare function scaffoldHarnessState(root: string): void;
/**
 * Inject backend API scripts and devDependencies into the consuming repo's package.json.
 * Called when installHarness is run with type === 'be'.
 */
export declare function injectBackendScripts(root: string): void;
/**
 * Sync Docskit-owned Cursor harness assets into a docs hub.
 * Skips package-local registry source files and preserves customized targets.
 */
export declare function installHarness(opts?: {
    projectRoot?: string;
    force?: boolean;
    type?: DocskitHarnessType;
    gitignoreEntries?: OwnedGitignoreEntry[];
    targets?: string[];
    defaultLanguage?: string;
}): HarnessInstallResult;
/**
 * Update only managed gitignore metadata on an existing install (used when
 * init merges ignores after harness assets are already written).
 */
export declare function recordManagedGitignore(projectRoot: string, entries: OwnedGitignoreEntry[]): HarnessInstallManifest;
export declare function statusHarness(opts?: {
    projectRoot?: string;
}): HarnessStatusResult;
export declare function pruneHarness(opts?: {
    projectRoot?: string;
    yes?: boolean;
}): HarnessPruneResult;
export interface HarnessUninstallResult {
    manifest: string;
    dryRun: boolean;
    deleted: string[];
    wouldDelete: string[];
    preservedModified: string[];
    missing: string[];
    manifestRemoved: boolean;
    registry?: string;
}
/**
 * Full removal: delete every docskit-owned harness file recorded in the manifest
 * (current + stale), preserve and report member-modified files, un-merge the
 * shared extract registry, remove exclusive ignore entries (keep shared), then
 * drop the manifest. Dry-run unless `yes`.
 */
export declare function uninstallHarness(opts?: {
    projectRoot?: string;
    yes?: boolean;
}): HarnessUninstallResult;
