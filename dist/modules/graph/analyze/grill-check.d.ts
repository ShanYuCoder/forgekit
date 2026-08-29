/**
 * Grill-oriented check: surfaces askUser prompts for missing hashtags / commons.
 * Thin wrapper so MCP tool names match the product vocabulary (/dev-grill-docs).
 *
 * Extended (API Reuse): detects duplicate URI paths across product surfaces.
 * When a spec's path already exists in another surface without #reuse-api,
 * emits a `duplicate-api-route` gap with suggestedTag: '#reuse-api'.
 * The agent adds the tag — no A/B/C gate needed.
 */
import type { AnalyzeResult, ArtifactgraphConfig } from '../types.js';
import type { IndexStore } from '../db/index-store.js';
export interface GrillCheckInput {
    repoRoot: string;
    cfg: ArtifactgraphConfig;
    /** Existing IR spec — preferred when past /dev-grill. */
    specPath?: string;
    /** Raw bullets — for early BA/dev notes before IR exists. */
    bullets?: string;
    store?: IndexStore;
}
/**
 * Returns analyze result focused on confirm questions (A/B/C).
 * Appends duplicate-api-route gaps when a spec defines paths that already
 * exist in other surfaces and lack a #reuse-api tag.
 * The suggested resolution is always: add #reuse-api tag.
 */
export declare function grillCheck(input: GrillCheckInput): AnalyzeResult;
/**
 * Persist member confirm so next analyzeBullets can skip cloud.
 */
export declare function recordGrillDecision(store: IndexStore, subject: string, choice: 'A' | 'B' | 'C', payload: Record<string, unknown>): void;
