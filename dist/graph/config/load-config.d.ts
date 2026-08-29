/**
 * Load / write artifactgraph.json inside a product repo.
 *
 * Brownfield init does NOT copy templates — it only drops this config
 * (often cloned from stacks/<stack>.json) so MCP knows allowlisted commands
 * and optional dsl.lanes pointers. Registry JSON payloads stay in product git.
 */
import type { ArtifactgraphConfig } from '../types.js';
export declare const CONFIG_NAME = "artifactgraph.json";
export declare const INDEX_DIR = ".artifactgraph";
export declare function parseRepoConfig(input: unknown): ArtifactgraphConfig;
/** Standalone defaults when a repo has not been initialized yet. */
export declare function defaultRepoConfig(projectId?: string): ArtifactgraphConfig;
/** Read product-repo config; returns null if not initialized. */
export declare function loadRepoConfig(repoRoot: string): ArtifactgraphConfig | null;
/** Load local config or standalone generic defaults. */
export declare function loadEffectiveRepoConfig(repoRoot: string): ArtifactgraphConfig;
/** Require config or throw (used by gen / analyze when project must be wired). */
export declare function requireRepoConfig(repoRoot: string): ArtifactgraphConfig;
/** Load stack preset from this package (stacks/nuxt4.json, …). */
export declare function loadStackPreset(stack: string): ArtifactgraphConfig;
/**
 * Write brownfield config into product repo + ensure .artifactgraph/ exists.
 * Never overwrites an existing artifactgraph.json unless `force`.
 */
export declare function writeBrownfieldConfig(repoRoot: string, opts: {
    stack: string;
    projectId: string;
    force?: boolean;
}): string;
