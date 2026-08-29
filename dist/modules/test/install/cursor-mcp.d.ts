import type { TestkitType } from '../config/project-root.js';
export declare function installCursorMcp(opts: {
    projectRoot: string;
    type: TestkitType;
    testsRoot?: string;
    docsRoot?: string;
}): {
    path: string;
    written: boolean;
};
export type McpLocation = 'local' | 'global';
export interface UninstallCursorMcpResult {
    path: string;
    dryRun: boolean;
    removed: boolean;
    absent: boolean;
    preservedInvalid: boolean;
}
export declare function cursorMcpPath(opts: {
    location: McpLocation;
    projectRoot?: string;
}): string;
/** Remove only the Testkit key, preserving every other MCP server and setting. */
export declare function uninstallCursorMcp(opts: {
    location: McpLocation;
    projectRoot?: string;
    yes?: boolean;
}): UninstallCursorMcpResult;
