import { type McpMergeResult, type McpStdioEntry } from './mcp-config.js';
import type { InstallManifestMcp } from './harness.js';
/**
 * Cross-repo index routing: wire per-repo CodeGraph MCP servers so a skill/rule
 * can reach the *correct* repo's index instead of building one giant workspace
 * graph. Roots come only from the member-owned machine-local maps
 * (`platform-repos.local.json`, `legacy-repos.local.json`) — never from a scan
 * of the workspace parent.
 */
export type RepoSource = 'platform' | 'legacy';
export interface RepoRef {
    key: string;
    root: string;
    source: RepoSource;
}
export interface CodegraphServerPlan {
    key: string;
    name: string;
    /** Normalized runtime root (or the raw value when it could not be resolved). */
    root: string;
    source: RepoSource;
    exists: boolean;
    hasIndex: boolean;
    /** Present when the entry is not wired: reason to show the member. */
    skipped?: string;
}
export interface CodegraphPlan {
    wire: CodegraphServerPlan[];
    skipped: CodegraphServerPlan[];
    /** Repos that exist but have no `.codegraph/` yet, with the exact init hint. */
    needsIndex: Array<{
        key: string;
        root: string;
        hint: string;
    }>;
}
export declare function isWsl(): boolean;
/**
 * Resolve a declared root to a path usable in the *current* runtime. In WSL a
 * `D:\...` value is rewritten to `/mnt/d/...`; on plain Linux a Windows-style
 * path fails closed (never written verbatim into a command run under WSL).
 */
export declare function normalizeRuntimePath(input: string): {
    path?: string;
    error?: string;
};
export declare function readRepoRefs(root: string): RepoRef[];
export declare function codegraphCommand(): string;
export declare function codegraphServerEntry(root: string): McpStdioEntry;
/**
 * Build the wiring plan. `selfRoot` (the repo being initialized) is excluded by
 * default so cross-index only targets *other* repos; `filterKeys` narrows the
 * set further so init never wires every checkout.
 */
export declare function planCodegraphServers(opts: {
    root: string;
    filterKeys?: string[];
    includeSelf?: boolean;
    refs?: RepoRef[];
}): CodegraphPlan;
export declare const CODEGRAPH_MCP_FILE = ".cursor/mcp.json";
export interface WireCodegraphResult {
    plan: CodegraphPlan;
    mcpFile: string;
    merge?: McpMergeResult;
    manifestMcp?: InstallManifestMcp;
}
/**
 * Plan and (unless dry-run) merge the per-repo CodeGraph servers into the repo's
 * local `.cursor/mcp.json`. Returns the manifest fragment describing exactly the
 * servers we own, so status/deinit can verify and unwire them precisely.
 */
export declare function wireCodegraph(opts: {
    root: string;
    filterKeys?: string[];
    includeSelf?: boolean;
    dryRun?: boolean;
    refs?: RepoRef[];
}): WireCodegraphResult;
