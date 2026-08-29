export declare function stateDir(): string;
export declare function ledgerPath(): string;
/** Registered repos whose manifest still exists (stale entries pruned). */
export declare function readLedger(): string[];
export declare function recordInstall(repoRoot: string): void;
export declare function forgetInstall(repoRoot: string): void;
export declare function removeLedger(): boolean;
/**
 * Scan a directory tree for repos carrying a docskit manifest — used to recover
 * install locations for ledger-less older installs (`uninstall --discover`).
 */
export declare function discoverInstalls(dir: string, maxDepth?: number): string[];
