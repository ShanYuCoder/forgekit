/**
 * Analyze an existing ir/spec.yaml (or any YAML with tags/codegen).
 *
 * Local-first: compare tags + codegen block against registries → Gap[].
 * High-confidence gaps can be fixed without cloud; low-confidence go into cloudPromptSlice.
 */
import type { AnalyzeResult, ArtifactgraphConfig } from '../types.js';
import type { IndexStore } from '../db/index-store.js';
/**
 * Core analyzer for a single spec file.
 */
export declare function analyzeSpecFile(repoRoot: string, cfg: ArtifactgraphConfig, specPath: string, store?: IndexStore): AnalyzeResult;
