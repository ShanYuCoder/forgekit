export interface PlatformDnaWireResult {
    attempted: boolean;
    command: string;
    args: string[];
    status?: number;
    stdout: string;
    stderr: string;
    skipped?: 'not-initialized' | 'command-unavailable';
}
/**
 * Delegate cross-repo CodeGraph ownership to Platform DNA. Codegenkit never
 * reads project maps or writes `codegraph-*` MCP entries itself.
 */
export declare function wirePlatformDnaCodegraph(opts: {
    projectRoot: string;
    filterKeys?: string;
}): PlatformDnaWireResult;
