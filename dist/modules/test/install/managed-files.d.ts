import type { TestkitType } from '../config/project-root.js';
export declare const TESTKIT_PACKAGE_SCRIPTS: Record<TestkitType, Record<string, string>>;
export interface ManagedRepoFiles {
    packageScripts?: Record<string, string>;
    gitignoreLines?: string[];
}
interface SyncResult {
    managed: ManagedRepoFiles;
    written: string[];
    unchanged: string[];
    conflicts: string[];
}
interface RemovalResult {
    wouldDelete: string[];
    deleted: string[];
    preservedModified: string[];
    missing: string[];
}
export declare function canonicalGitignorePattern(pattern: string): string;
/**
 * Single source of generated local targets used by init and persisted for
 * status/deinit. Harness and install state are always local; agent paths come
 * only from configurations actually managed by the selected adapters.
 */
export declare function generatedTargets(opts: {
    projectRoot: string;
    agentPaths?: string[];
}): string[];
/**
 * Platform DNA gitignore contract: append only missing entries, recognize
 * root-anchored equivalents, preserve member lines and the existing EOL.
 */
export declare function ensureGitignoreEntries(projectRoot: string, patterns: string[]): {
    file: string;
    added: string[];
    changed: boolean;
};
export declare function syncManagedRepoFiles(opts: {
    projectRoot: string;
    type: TestkitType;
    previous?: ManagedRepoFiles;
    ignoreEntries?: string[];
}): SyncResult;
export declare function managedRepoStatus(projectRoot: string, managed: ManagedRepoFiles | undefined): {
    healthy: string[];
    missing: string[];
    modified: string[];
};
export declare function removeManagedRepoFiles(opts: {
    projectRoot: string;
    managed?: ManagedRepoFiles;
    yes?: boolean;
}): RemovalResult;
export {};
