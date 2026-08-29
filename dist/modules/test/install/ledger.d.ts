export declare function stateDir(): string;
export declare function ledgerPath(): string;
export declare function readLedger(): string[];
export declare function recordInstall(repoRoot: string): void;
export declare function forgetInstall(repoRoot: string): void;
export declare function removeLedger(): boolean;
export declare function discoverInstalls(dir: string, maxDepth?: number): string[];
