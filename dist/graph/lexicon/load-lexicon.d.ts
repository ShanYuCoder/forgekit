/**
 * Parse project-local or packaged lexicon files.
 * Local index only — never dump full file into cloudPromptSlice.
 */
import type { ArtifactgraphConfig } from '../types.js';
import type { IndexStore } from '../db/index-store.js';
export type SuggestLane = 'fe' | 'docs' | 'plans' | 'be';
export interface RegistryTagsLexicon {
    kind: 'registryTags';
    path: string;
    prefixes: string[];
    shellIds: string[];
    /** Lowercase keyword → suggested draft tag (subset). */
    keywordHints: Record<string, string>;
    terms: string[];
}
export interface TestTaxonomyLexicon {
    kind: 'testTaxonomy';
    path: string;
    types: string[];
    scenarios: string[];
    dimensions: {
        business: string[];
        technical: string[];
        quality: string[];
    };
    terms: string[];
}
export type LoadedLexicon = RegistryTagsLexicon | TestTaxonomyLexicon;
export interface SuggestTagsResult {
    lane: SuggestLane;
    draftTags: string[];
    enums?: Record<string, string[]>;
    matches: Array<{
        term: string;
        tag?: string;
        score: number;
    }>;
    sourcePaths: string[];
    /** Tiny slice for cloud — matches only, not full lexicon */
    cloudPromptSlice: string;
}
/** Parse R2.1 registry-tags.en.txt */
export declare function parseRegistryTagsLexicon(absPath: string): RegistryTagsLexicon;
/** Parse R3.1 testcase-taxonomy.en.txt */
export declare function parseTestTaxonomyLexicon(absPath: string): TestTaxonomyLexicon;
export declare function loadRegistryTagsLexicon(repoRoot: string, cfg: ArtifactgraphConfig): RegistryTagsLexicon | null;
export declare function loadTestTaxonomyLexicon(repoRoot: string, cfg: ArtifactgraphConfig): TestTaxonomyLexicon | null;
/** Index lexicons into SQLite under registry namespaces lexicon:*. */
export declare function indexLexicons(store: IndexStore, repoRoot: string, cfg: ArtifactgraphConfig): Record<string, number>;
/**
 * Suggest draft tags / taxonomy enums for a lane (local-first).
 */
export declare function suggestTags(opts: {
    repoRoot: string;
    cfg: ArtifactgraphConfig;
    lane: SuggestLane;
    bullets?: string;
    limit?: number;
}): SuggestTagsResult;
