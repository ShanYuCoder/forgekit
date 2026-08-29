export declare const INSTALL_MANIFEST_REL = ".artifactgraph/install-manifest.json";
export declare function stateDir(): string;
export declare function ledgerPath(): string;
export declare function readLedger(): string[];
export declare function recordInstall(repoRoot: string): void;
export declare function forgetInstall(repoRoot: string): void;
export declare function removeLedger(): boolean;
/** Recover older installs that predate the ledger. */
export declare function discoverInstalls(dir: string, maxDepth?: number): string[];
