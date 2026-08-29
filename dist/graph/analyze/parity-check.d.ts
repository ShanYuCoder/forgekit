/**
 * Cross-surface parity: create≠edit validation, register≠change-password,
 * FE≠BE empty policy (null / '' / [] / omit), type drift.
 *
 * Local-first: ingest structured findings (from IR scan or cloud same-turn),
 * emit GapKind parity-drift + askUser for member — never cloud for the confirm.
 */
import type { AnalyzeResult } from '../types.js';
import type { IndexStore } from '../db/index-store.js';
export interface ParityCheckInput {
    repoRoot: string;
    projectId?: string;
    /** Module dir with _legacy.trace.yaml + child bundles / ir/legacy.yaml */
    moduleDir?: string;
    /** Explicit findings file (yaml/json) from cloud archaeology */
    findingsPath?: string;
    /** Inline findings JSON string */
    findingsJson?: string;
    store?: IndexStore;
}
/** Compact schema block — append to cloudPromptSlice on /legacy-spec (1 turn). */
export declare function parityCloudSchemaBlock(): string;
export declare function parityCheck(input: ParityCheckInput): AnalyzeResult;
/** Persist member parity choice (subject = finding id or field:name). */
export declare function recordParityDecision(store: IndexStore, subject: string, choice: 'A' | 'B' | 'C', payload?: Record<string, unknown>): void;
