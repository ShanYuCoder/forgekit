export declare function packageRoot(): string;
export declare function looksLikeHub(abs: string): boolean;
/**
 * Best-effort root for local wiring. Empty when no project root is available.
 */
export declare function defaultDocskitRoot(): string;
export declare function resolveDocsRoot(explicit?: string): string;
export declare function enginesRoot(): string;
