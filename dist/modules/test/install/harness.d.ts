import { type TestkitType } from '../config/project-root.js';
import type { AgentId } from './agents.js';
import { type ManagedRepoFiles } from './managed-files.js';
export declare const INSTALL_MANIFEST_PATH = ".testkit/install-manifest.json";
export declare const SKILLS_BY_TYPE: Record<TestkitType, string[]>;
export interface InstallManifestFile {
    source: string;
    sha256: string;
    stale?: boolean;
}
export interface InstallManifest {
    schemaVersion: 1;
    package: '@platform/testkit';
    packageVersion: string;
    type: TestkitType;
    toolApi: 1;
    harnessApi: 1;
    targets?: AgentId[];
    files: Record<string, InstallManifestFile>;
    managed?: ManagedRepoFiles;
}
export interface HarnessCompatibility {
    compatible: boolean;
    issues: string[];
}
export interface HarnessStatus {
    manifestPath: string;
    installed: boolean;
    type?: TestkitType;
    packageVersion?: string;
    compatibility: HarnessCompatibility;
    healthy: string[];
    missing: string[];
    modified: string[];
    stale: string[];
}
export interface PruneHarnessResult {
    dryRun: boolean;
    candidates: string[];
    deleted: string[];
    preservedModified: string[];
    preservedProtected: string[];
    missing: string[];
}
export interface UninstallHarnessResult {
    dryRun: boolean;
    manifest: string;
    wouldDelete: string[];
    deleted: string[];
    preservedModified: string[];
    preservedProtected: string[];
    missing: string[];
    manifestRemoved: boolean;
}
export declare function installHarness(opts: {
    projectRoot: string;
    type: TestkitType;
    targets?: AgentId[];
    force?: boolean;
    ignoreEntries?: string[];
}): {
    written: string[];
    unchanged: string[];
    conflicts: string[];
    skipped: string[];
};
export declare function statusHarness(opts: {
    projectRoot: string;
}): HarnessStatus;
export declare function pruneHarness(opts: {
    projectRoot: string;
    yes?: boolean;
}): PruneHarnessResult;
/**
 * Remove only Testkit assets recorded by a compatible manifest. Modified files
 * and any path that could belong to ArtifactGraph are always preserved.
 */
export declare function uninstallHarness(opts: {
    projectRoot: string;
    yes?: boolean;
}): UninstallHarnessResult;
