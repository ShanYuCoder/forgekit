/**
 * Product surface/module path helpers.
 *
 * Canonical (Docskit hub): product/surfaces/<surface>/CMP-* /...
 * Legacy: product/surfaces/<surface>/modules/CMP-* /...
 */
/**
 * Infer `surface/CMP-*` label from a file under the product tree.
 * Prefers canonical layout; falls back to legacy `modules/` segment.
 */
export declare function inferSurfaceFromRepoPath(absPath: string, repoRoot: string): string;
/** True when path uses the legacy modules/CMP-* segment. */
export declare function isLegacyModulesCmpPath(filePath: string): boolean;
