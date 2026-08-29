/**
 * Shared `.gitignore` contract for every toolkit `init`.
 *
 * Destination repos never hand-maintain toolkit ignore blocks. Each toolkit
 * merges only the entries its own init actually generated, using the helpers
 * here so the semantics (idempotent, EOL-preserving, equivalence-aware) stay
 * identical across Docskit, Testkit, ArtifactGraph, Processkit and
 * Codegenkit.
 */
export interface OwnedGitignoreEntry {
    pattern: string;
    /**
     * Shared entries may be relied on by other toolkits (for example `.cursor/`
     * or `.cursor/mcp.json`). They are ensured on init but kept on deinit so a
     * single toolkit removal never breaks another toolkit still using them.
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
/**
 * Canonical form so `.cursor/`, `/.cursor/` and `.cursor` compare equal.
 * Preserves negation (`!`) and glob text; only leading `./`, leading `/` and
 * trailing `/` are normalized because git treats those as equivalent anchors.
 */
export declare function canonicalGitignorePattern(pattern: string): string;
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
