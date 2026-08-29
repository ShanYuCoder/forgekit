/**
 * Shared `.gitignore` contract (Platform DNA semantics):
 * idempotent, EOL-preserving, equivalence-aware.
 *
 * Destination repos never hand-maintain Codegenkit ignore blocks. Init merges
 * only the local artifacts this run actually wrote.
 */
export interface OwnedGitignoreEntry {
    pattern: string;
    /**
     * Shared entries may be relied on by other toolkits (for example `.cursor/`).
     * Ensured on init but kept on deinit so removing Codegenkit never breaks
     * another toolkit still using them.
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
export interface GeneratedTargetInput {
    projectRoot: string;
    /** Absolute paths Codegenkit actually wrote (agent configs, permissions, …). */
    written: string[];
    /** True when this run installed/updated the harness + `.codegenkit/` state. */
    harnessInstalled: boolean;
    /** When set to laravel, also claim the synced PHP unitgen tree. */
    beAdapter?: string;
    targets?: string[];
}
/**
 * Canonical form so `.cursor/`, `/.cursor/` and `.cursor` compare equal.
 */
export declare function canonicalGitignorePattern(pattern: string): string;
/**
 * Ensure every pattern is present exactly once. Creates the file when missing,
 * migrates the legacy owned block once, preserves member content and EOL.
 */
export declare function ensureGitignoreEntries(root: string, patterns: string[]): EnsureGitignoreResult;
/**
 * Remove the given patterns (matched by equivalence) while preserving unrelated
 * member lines and the file's dominant EOL.
 */
export declare function removeGitignoreEntries(root: string, patterns: string[]): RemoveGitignoreResult;
/**
 * Map a repo-local written path to the coarsest ignore entry Codegenkit should own.
 */
export declare function ignorePatternForLocalPath(projectRoot: string, absolutePath: string): string | undefined;
/**
 * Single source of truth for ignore entries produced by a Codegenkit init run.
 * Only local, actually-written toolkit targets; never product `src/`/`generated/`
 * or `.codegraph*`.
 */
export declare function generatedTargets(input: GeneratedTargetInput): OwnedGitignoreEntry[];
/**
 * Merge previous + next owned ignore entries. `shared` wins if either side
 * marks the pattern shared.
 */
export declare function mergeOwnedGitignore(previous: OwnedGitignoreEntry[] | undefined, next: OwnedGitignoreEntry[] | undefined): OwnedGitignoreEntry[];
