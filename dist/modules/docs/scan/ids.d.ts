export type IdKind = 'CMP' | 'FLOW' | 'DEP' | 'ADR' | 'W' | 'API' | 'UI' | 'OTHER';
export type HubId = {
    id: string;
    kind: IdKind;
    files: string[];
    /** First file under the canonical chapter/product path when known */
    primary?: string;
};
/** Scan roots for MD (arc42 × product). */
export declare const SCAN_MD_DIRS: readonly ["architecture", "product/overview", "product/surfaces"];
/** Canonical home for each ID kind (architecture-core). */
export declare const CANONICAL_DIR: Partial<Record<IdKind, string>>;
export declare function kindOf(id: string): IdKind;
export declare function isRedirectStub(relOrAbs: string, docsRoot?: string): boolean;
export declare function walkMdFiles(root: string, relDirs: string[]): string[];
export declare function extractIdsFromText(text: string): Set<string>;
export declare function indexIds(docsRoot: string): Map<string, HubId>;
export declare function relToRoot(docsRoot: string, abs: string): string;
declare function flowMetaFromFile(docsRoot: string, abs: string): {
    id: string;
    file: string;
    domain: string | undefined;
    status: string | undefined;
};
/** Catalog FLOW-*.md plus LCA common/processes (dedupe by id, catalog wins). */
export declare function listFlowProcessFiles(docsRoot: string): ReturnType<typeof flowMetaFromFile>[];
/** Expected on-disk path for kinds that have a file/folder SSOT. */
export declare function expectedCanonicalPath(docsRoot: string, id: string): string | null;
export {};
