/**
 * Legacy explicit-map helpers plus package-root and stack detection.
 *
 * MCP repositories no longer ship platform-repos.json. Legacy callers must
 * provide a map path explicitly. Normal runtime binds directly to cwd.
 *
 * Explicit-map workspace resolution order:
 * 1. ARTIFACTGRAPH_WORKSPACE env
 * 2. ~/.artifactgraph/workspace.path (written by install.sh when ~/workspace exists)
 * 3. map workspaceRoot relative to package root
 *
 * Project `root` fields are relative to that workspace (e.g. "portal"), not the package.
 */
import type { PlatformProject, PlatformReposMap } from '../types.js';
/** Absolute path to the artifactgraph package root. */
export declare function packageRoot(): string;
/**
 * Absolute directory that contains portal/, nextjs/, … bases.
 */
export declare function resolveWorkspaceRoot(mapWorkspaceRoot: string): string;
/**
 * Load an explicitly supplied legacy platform-repos map.
 */
export declare function loadPlatformReposMap(mapPath?: string): PlatformReposMap;
/** Resolve harness sync profile for a project id (full | shared | docs | tests | tooling). */
export declare function resolveHarnessProfile(projectId: string, map?: PlatformReposMap): string;
/** Expected `.cursor/skills` folder names for a project (from harness.profiles). */
export declare function resolveHarnessSkills(projectId: string, map?: PlatformReposMap): string[];
/** Look up one project; throws with a helpful list if id is wrong. */
export declare function resolveProject(projectId: string, mapPath?: string): PlatformProject & {
    id: string;
};
/**
 * Infer stack from cwd product repo (brownfield heuristics).
 */
export declare function detectStack(repoRoot: string): string;
