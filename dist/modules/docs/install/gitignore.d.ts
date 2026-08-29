import { type InstallLocation } from './agents.js';
/**
 * Docskit `.gitignore` contract — same semantics as Platform DNA
 * `ensureGitignoreEntries` / `removeGitignoreEntries`:
 * idempotent, EOL-preserving, equivalence-aware.
 *
 * Destination repos never hand-maintain Docskit ignore blocks. Init merges
 * only the local artifacts this run actually wrote.
 */
export interface OwnedGitignoreEntry {
    pattern: string;
    /**
     * Shared entries may be relied on by other toolkits (for example `.cursor/`).
     * Ensured on init but kept on deinit so removing Docskit never breaks another
     * toolkit still using them.
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
    location: InstallLocation;
    /** Absolute paths Docskit actually wrote (agent configs, permissions, …). */
    written: string[];
    harnessInstalled?: boolean;
    targets?: string[];
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
/**
 * Map a repo-local written path to the coarsest ignore entry Docskit should own.
 * Returns undefined for paths outside the project or that should not be ignored
 * as a top-level agent/harness artifact.
 */
export declare function ignorePatternForLocalPath(projectRoot: string, absolutePath: string): string | undefined;
/**
 * Single source of truth for ignore entries produced by a Docskit init run.
 * Only local, actually-written targets are included; global/home configs never
 * pollute the repo `.gitignore`.
 */
export declare function generatedTargets(input: GeneratedTargetInput): OwnedGitignoreEntry[];
/**
 * Merge previous + next owned ignore entries. `shared` wins if either side
 * marks the pattern shared.
 */
export declare function mergeOwnedGitignore(previous: OwnedGitignoreEntry[] | undefined, next: OwnedGitignoreEntry[] | undefined): OwnedGitignoreEntry[];
