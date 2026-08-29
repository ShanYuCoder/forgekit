import { type BeAdapterId, type CodegenType, type FeAdapterId } from '../config/project-root.js';
import { type AgentMcpOwnership } from './agents.js';
import { type OwnedGitignoreEntry } from './gitignore.js';
export declare const FE_SKILLS: readonly ["gen-common", "prototype", "wire", "unit", "grill-prototype", "grill-unit", "model"];
export declare const BE_SKILLS: readonly ["api", "grill-api", "api-unit", "grill-api-unit"];
/** `/model` and `/gen-common` are web-FE only; WinForms Line skips them. */
export declare function feSkillsForAdapter(adapter?: FeAdapterId): readonly (typeof FE_SKILLS)[number][];
export interface InstallManifest {
    schemaVersion: 1;
    package: '@platform/codegenkit';
    packageVersion: string;
    type: CodegenType;
    adapters: {
        fe?: FeAdapterId;
        be?: BeAdapterId;
    };
    toolApi: 1;
    harnessApi: 1;
    files: Record<string, {
        source: string;
        sha256: string;
        stale?: boolean;
    }>;
    /** Exact `.gitignore` entries Codegenkit ensured, with shared-ownership. */
    gitignore?: OwnedGitignoreEntry[];
    /** Per-agent MCP ownership so status/deinit can verify and unwire safely. */
    mcp?: Record<string, AgentMcpOwnership>;
}
export interface GitignoreEntryStatus {
    pattern: string;
    shared: boolean;
    status: 'present' | 'missing';
}
export interface McpAgentStatus {
    agent: string;
    file: string;
    status: 'present' | 'missing' | 'modified';
}
export interface HarnessInstallResult {
    written: string[];
    unchanged: string[];
    conflicts: string[];
    skipped: string[];
    stale: string[];
    gitignore: OwnedGitignoreEntry[];
}
export interface HarnessStatus {
    projectRoot: string;
    packageVersion: string;
    installed: boolean;
    packageVersionInstalled: string | null;
    type: CodegenType | null;
    adapters: InstallManifest['adapters'] | null;
    toolApi: number | null;
    harnessApi: number | null;
    healthy: string[];
    missing: string[];
    modified: string[];
    stale: string[];
    /** Non-manifest leftovers (e.g. product-root contractgen/) */
    warnings: string[];
    gitignore: GitignoreEntryStatus[];
    mcp: McpAgentStatus[];
    compat: 'ok' | 'warn' | 'fail';
}
export interface PruneResult {
    removable: string[];
    modified: string[];
    removed: string[];
}
export interface HarnessUninstallResult {
    manifest: string;
    dryRun: boolean;
    removable: string[];
    removed: string[];
    modified: string[];
    missing: string[];
    manifestRemoved: boolean;
    /** Exclusive gitignore patterns removed (or would remove). */
    gitignoreRemoved: string[];
}
export declare function manifestFile(root: string): string;
/** Public read of the install manifest (null when absent). */
export declare function readInstallManifest(projectRoot?: string): InstallManifest | null;
export declare function installHarness(opts: {
    projectRoot: string;
    type: CodegenType;
    feAdapter?: FeAdapterId;
    beAdapter?: BeAdapterId;
    force?: boolean;
    gitignoreEntries?: OwnedGitignoreEntry[];
    mcp?: Record<string, AgentMcpOwnership>;
    targets?: string[];
}): HarnessInstallResult;
export declare function harnessStatus(projectRoot?: string): HarnessStatus;
export declare function pruneHarness(opts?: {
    projectRoot?: string;
    yes?: boolean;
}): PruneResult;
/**
 * Remove all manifest-owned harness assets, current and stale. Files whose
 * content no longer matches the recorded installed hash are preserved.
 * Exclusive gitignore entries are removed; shared entries are kept.
 */
export declare function uninstallHarness(opts?: {
    projectRoot?: string;
    yes?: boolean;
    mcpRemovedPaths?: string[];
}): HarnessUninstallResult;
