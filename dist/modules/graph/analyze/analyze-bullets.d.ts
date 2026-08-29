/**
 * Turn user bullet text into draft tags + gaps WITHOUT calling the cloud.
 *
 * Heuristics (local-first):
 * - registries aliasIndex + design shells (FE)
 * - R2.1 registry-tags lexicon keywordHints (lane fe | be from stack)
 * - R3.1 via explicit plans lane (not auto here)
 * - Prior decisions in SQLite raise confidence
 *
 * Output is a draft — writing YAML is a later apply step (after member confirm).
 */
import type { AnalyzeResult, ArtifactgraphConfig } from '../types.js';
import type { IndexStore } from '../db/index-store.js';
/**
 * @param bullets Free-text lines from the user (BA/dev), not full IR yet
 */
export declare function analyzeBullets(repoRoot: string, cfg: ArtifactgraphConfig, bullets: string, store?: IndexStore): AnalyzeResult;
