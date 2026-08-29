export declare function stateDir(): string;
export declare function ledgerPath(): string;
export declare function readLedger(): string[];
export declare function recordInstall(repoRoot: string): void;
export declare function forgetInstall(repoRoot: string): void;
export declare function removeLedger(): boolean;
/** Find legacy installs that predate the ledger. */
export declare function discoverInstalls(directory: string, maxDepth?: number): string[];
