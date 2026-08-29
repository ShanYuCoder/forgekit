/**
 * Infer suggest/analyze lane from artifactgraph.json stack + dsl.lanes.
 */
import type { ArtifactgraphConfig } from '../types.js';
import type { SuggestLane } from './load-lexicon.js';
/** Product repo primarily FE (design/common registries). */
export declare function isFeStack(cfg: ArtifactgraphConfig): boolean;
/** Product repo primarily BE (codegen registry). True if dsl.lanes.be present (incl. fullstack). */
export declare function isBeStack(cfg: ArtifactgraphConfig): boolean;
/** Default suggest_tags lane — fullstack (fe+be) defaults to fe; pass lane=be explicitly for API. */
export declare function inferSuggestLane(cfg: ArtifactgraphConfig): SuggestLane;
