/**
 * Wire Docskit MCP into supported agent configurations.
 *
 * Agents: claude | cursor | codex | opencode | hermes | gemini | antigravity | kiro | kilo
 *
 * Interactive TTY: ↑↓ + Space toggle + Enter
 * Non-interactive: --yes / --target=csv|auto|all
 */
export type AgentId = 'claude' | 'cursor' | 'codex' | 'opencode' | 'hermes' | 'gemini' | 'antigravity' | 'kiro' | 'kilo';
export type InstallLocation = 'global' | 'local';
export declare const AGENT_IDS: AgentId[];
export declare const AGENT_DIRS: Record<AgentId, string[]>;
export interface InstallOptions {
    target?: string;
    location?: InstallLocation;
    yes?: boolean;
    useWsl?: boolean;
    mcpFile?: string;
    printConfig?: string;
    /** Override DOCSKIT_ROOT written into agent MCP env */
    docsRoot?: string;
}
export interface InstallResult {
    targets: AgentId[];
    location: InstallLocation;
    written: Array<{
        agent: AgentId;
        path: string;
    }>;
    skipped: string[];
}
type StdioEntry = {
    type?: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
};
export declare function buildMcpEntry(opts?: {
    useWsl?: boolean;
    docsRoot?: string;
    location?: InstallLocation;
}): StdioEntry;
export declare function mcpEntryForAgent(agent: AgentId, entry: StdioEntry): StdioEntry;
export declare function defaultCursorMcpPath(): string;
export declare function detectWindowsCursorMcpPath(): string | undefined;
export declare function defaultAntigravityMcpPath(): string;
export declare function detectWindowsAntigravityMcpPath(): string | undefined;
export declare function supportsLocation(_agent: AgentId, _location: InstallLocation): boolean;
export declare function agentConfigPath(agent: AgentId, location: InstallLocation, cwd?: string): string;
export declare function detectAgents(cwd?: string): AgentId[];
export declare function parseTargets(raw: string | undefined, detected: AgentId[]): AgentId[];
export declare function formatPrintConfig(agent: AgentId, location: InstallLocation, docsRoot?: string): string;
export declare function mergeMcpJson(file: string, entry: StdioEntry): string;
export declare function mergeClaudePermissions(location: InstallLocation, cwd?: string): string | null;
export declare function removeClaudePermissions(location: InstallLocation, dryRun: boolean, cwd?: string): string | null;
export interface UninstallAgentsOptions {
    target?: string;
    location?: InstallLocation;
    yes?: boolean;
    /** Project root for local configs (defaults to process.cwd()). */
    cwd?: string;
}
export interface UninstallAgentsResult {
    targets: AgentId[];
    location: InstallLocation;
    dryRun: boolean;
    removed: string[];
    absent: string[];
}
/** Reverse of installAgents — strip the docskit MCP entry from targeted agent configs. */
export declare function uninstallAgents(opts?: UninstallAgentsOptions): UninstallAgentsResult;
export declare function promptInstallAgents(detected?: AgentId[]): Promise<AgentId[]>;
export declare function installAgents(opts?: InstallOptions): Promise<InstallResult>;
export {};
