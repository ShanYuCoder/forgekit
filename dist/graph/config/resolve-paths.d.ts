/**
 * Standalone project path resolution.
 *
 * Paths may be:
 * - absolute
 * - relative to the current product `repoRoot`
 *
 * External `@projectId` paths are legacy and disabled in normal runtime.
 */
import type { ArtifactgraphConfig } from '../types.js';
/** Resolve one config path (specRoot, lexicon, command --dir token, …). */
export declare function resolveConfigPath(repoRoot: string, relOrAbs: string): string;
/** Legacy status shape; standalone runtime has no implicit hubs. */
export declare function resolveHubRoots(_repoRoot: string, _cfg: ArtifactgraphConfig): {
    docs?: string;
    tests?: string;
};
/** Absolute directories listed in `specRoots`. */
export declare function resolveSpecRoots(repoRoot: string, cfg: ArtifactgraphConfig): string[];
/**
 * Resolve a spec/testcase path for analyze/grill.
 * Tries: absolute → repoRoot → each explicitly configured local specRoot.
 */
export declare function resolveSpecPath(repoRoot: string, cfg: ArtifactgraphConfig, specPath: string): string;
/**
 * Expand repo-relative `gapSources` globs under the current product only.
 */
export declare function resolveGapSourceFiles(repoRoot: string, cfg: ArtifactgraphConfig): string[];
/** Reject legacy external-project tokens inside allowlisted argv. */
export declare function expandArgvPaths(repoRoot: string, argv: string[]): string[];
/** Resolve vocabulary lexicon path from config (relative to repo or @hub). */
export declare function resolveVocabularyPath(repoRoot: string, cfg: ArtifactgraphConfig, key: 'registryTags' | 'testTaxonomy'): string | null;
/** Summarize resolved roots for status / smoke. */
export declare function pathResolutionSummary(repoRoot: string, cfg: ArtifactgraphConfig): {
    repoRoot: string;
    hubs: {
        docs?: string;
        tests?: string;
    };
    specRoots: string[];
    vocabularies: {
        registryTags: string | null;
        testTaxonomy: string | null;
    };
};
