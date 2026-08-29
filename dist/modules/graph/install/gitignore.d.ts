/**
 * Shared `.gitignore` contract (Platform DNA semantics, ported standalone).
 *
 * Destination repos never hand-maintain toolkit ignore blocks. ArtifactGraph
 * merges only the entries its own init actually generated: idempotent,
 * EOL-preserving, equivalence-aware, with shared vs exclusive ownership.
 */
import { type AgentId } from './agents.js';
export interface OwnedGitignoreEntry {
    pattern: string;
    /**
     * Shared entries may be relied on by other toolkits (for example `.cursor/`
     * or `.cursor/mcp.json`). They are ensured on init but kept on deinit.
     */
    shared?: boolean;
}
export interface EnsureGitignoreResult {
    file: string;
    /** Entries newly written by this call (trimmed source form). */
    added: string[];
    changed: boolean;
}
export interface RemoveGitignoreResult {
    file?: string;
    removed: string[];
    changed: boolean;
}
export interface GeneratedTargetsInput {
    root: string;
    /** Absolute paths written by installAgents under the repo (local only). */
    writtenAgentPaths?: string[];
    /** True when this init created artifactgraph.json (not a pre-existing file). */
    createdConfig?: boolean;
    /** True when harness/lexicon assets under .cursor/ were installed. */
    wroteCursorHarness?: boolean;
    /** True when lexicon assets under artifactgraph/ were installed. */
    wroteLexicon?: boolean;
    /** The target agents being installed to */
    targets?: AgentId[];
}
/**
 * Canonical form so `.cursor/`, `/.cursor/` and `.cursor` compare equal.
 * Preserves negation (`!`) and glob text; only leading `./`, leading `/` and
 * trailing `/` are normalized because git treats those as equivalent anchors.
 */
export declare function canonicalGitignorePattern(pattern: string): string;
/**
 * Strip the legacy ArtifactGraph marker block if present. Returns whether the
 * file content changed. Member lines outside the block are preserved.
 */
export declare function stripLegacyGitignoreBlock(root: string): {
    file: string;
    changed: boolean;
};
/**
 * Ensure every pattern is present exactly once. Creates the file when missing,
 * preserves existing member content and the file's dominant EOL, and never
 * duplicates an equivalent pattern.
 */
export declare function ensureGitignoreEntries(root: string, patterns: string[]): EnsureGitignoreResult;
/**
 * Remove the given patterns (matched by equivalence) while preserving unrelated
 * member lines and the file's dominant EOL. Missing files/patterns are a no-op.
 */
export declare function removeGitignoreEntries(root: string, patterns: string[]): RemoveGitignoreResult;
/** Merge previous + next ownership; shared is sticky once set. */
export declare function mergeGitignoreEntries(previous: OwnedGitignoreEntry[] | undefined, next: OwnedGitignoreEntry[] | undefined): OwnedGitignoreEntry[];
/** Map a repo-relative agent config path to the ignore pattern we own. */
export declare function agentPathIgnorePattern(repoRelative: string): string | null;
/**
 * Desired ignore patterns for this init, derived from artifacts actually
 * produced under the repo. Global/out-of-repo agent paths are excluded.
 */
export declare function desiredGitignorePatterns(input: GeneratedTargetsInput): {
    exclusive: string[];
    shared: string[];
};
/**
 * Ensure desired patterns and return ownership records for the manifest.
 * Exclusive patterns are claimed only when this run actually added them;
 * shared patterns are always recorded when intended (sticky across toolkits).
 */
export declare function applyGeneratedGitignore(input: GeneratedTargetsInput): {
    file: string;
    changed: boolean;
    entries: OwnedGitignoreEntry[];
    added: string[];
};
/** Status rows for owned ignore entries against the live `.gitignore`. */
export declare function gitignoreEntryStatus(root: string, entries: OwnedGitignoreEntry[]): Array<{
    pattern: string;
    shared: boolean;
    present: boolean;
}>;
