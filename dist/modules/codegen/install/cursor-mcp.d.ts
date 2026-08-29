import { type BeAdapterId, type CodegenType, type FeAdapterId } from '../config/project-root.js';
export type McpLocation = 'local' | 'global';
export interface CursorMcpUninstallResult {
    path: string;
    dryRun: boolean;
    removed: boolean;
    absent: boolean;
    preserved: boolean;
}
export declare function cursorMcpPath(projectRoot: string, location?: McpLocation): string;
export declare function installCursorMcp(opts: {
    projectRoot: string;
    type: CodegenType;
    feAdapter?: FeAdapterId;
    beAdapter?: BeAdapterId;
    docsRoot?: string;
    location?: McpLocation;
}): {
    path: string;
    written: boolean;
};
/** Remove only Codegenkit's key from the shared Cursor MCP config. */
export declare function uninstallCursorMcp(opts?: {
    projectRoot?: string;
    location?: McpLocation;
    yes?: boolean;
}): CursorMcpUninstallResult;
