/**
 * Wire artifactgraph MCP into agent configs (CodeGraph-style `install --target=`).
 *
 * Agents (CodeGraph parity + Kilo):
 *   claude | cursor | codex | opencode | hermes | gemini | antigravity | kiro | kilo
 *
 * Interactive TTY: ↑↓ + Space toggle + Enter
 * Non-interactive: --yes / --target=csv|auto|all
 */
export type AgentId = 'claude' | 'cursor' | 'codex' | 'opencode' | 'hermes' | 'gemini' | 'antigravity' | 'kiro' | 'kilo';
export type InstallLocation = 'global' | 'local';
/** Order matches CodeGraph multiselect, then Kilo. */
export declare const AGENT_IDS: AgentId[];
export declare const AGENT_DIRS: Record<AgentId, string[]>;
export interface InstallOptions {
    /** csv / auto / all / single id */
    target?: string;
    location?: InstallLocation;
    yes?: boolean;
    useWsl?: boolean;
    /** Override path for one-shot (legacy --mcp-file, cursor only) */
    mcpFile?: string;
    /** Dump snippet for one agent; no writes */
    printConfig?: string;
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
};
/** Build stdio MCP entry, optionally pinned to the initialized project root. */
export declare function buildMcpEntry(opts?: {
    useWsl?: boolean;
    projectRoot?: string;
}): StdioEntry;
/**
 * Antigravity mcp_config schema forbids unknown keys (no `type`).
 * Cursor/Claude/Kilo/Gemini/Kiro keep optional type: stdio.
 */
export declare function mcpEntryForAgent(agent: AgentId, entry: StdioEntry): StdioEntry;
/** @deprecated use buildMcpEntry */
export declare function buildArtifactgraphMcpEntry(opts?: {
    useWsl?: boolean;
}): {
    command: string;
    args: string[];
};
export declare function defaultCursorMcpPath(): string;
/** When running inside WSL, prefer the Windows Cursor config Cursor actually loads. */
export declare function detectWindowsCursorMcpPath(): string | undefined;
/**
 * Antigravity: prefer unified `~/.gemini/config/mcp_config.json` (CodeGraph),
 * fall back to legacy `~/.gemini/antigravity/mcp_config.json`.
 */
export declare function defaultAntigravityMcpPath(): string;
export declare function detectWindowsAntigravityMcpPath(): string | undefined;
export declare function supportsLocation(_agent: AgentId, _location: InstallLocation): boolean;
export declare function agentConfigPath(agent: AgentId, location: InstallLocation, cwd?: string): string;
/** Heuristic: agent looks installed / previously configured. */
export declare function detectAgents(cwd?: string): AgentId[];
export declare function parseTargets(raw: string | undefined, detected: AgentId[]): AgentId[];
export declare function formatPrintConfig(agent: AgentId, location: InstallLocation): string;
/** Merge artifactgraph into mcpServers JSON file. */
export declare function mergeMcpJson(file: string, entry: StdioEntry): string;
/** Claude Code: optional auto-allow for artifactgraph tools. */
export declare function mergeClaudePermissions(location: InstallLocation, cwd?: string): string | null;
/** Legacy single-target Cursor helper. */
export declare function installCursorMcp(opts?: {
    mcpFile?: string;
    useWsl?: boolean;
    yes?: boolean;
}): string;
export declare function removeClaudePermissions(location: InstallLocation, dryRun: boolean, cwd?: string): string | null;
export interface UninstallAgentsOptions {
    target?: string;
    location?: InstallLocation;
    yes?: boolean;
    cwd?: string;
}
export interface UninstallAgentsResult {
    targets: AgentId[];
    location: InstallLocation;
    dryRun: boolean;
    removed: string[];
    absent: string[];
}
/** Remove only ArtifactGraph-owned keys from shared agent configuration. */
export declare function uninstallAgents(opts?: UninstallAgentsOptions): UninstallAgentsResult;
/**
 * Interactive / non-interactive multi-agent init (CodeGraph-style UX).
 * CLI command: `artifactgraph init` (alias: `install`).
 */
export declare function installAgents(opts?: InstallOptions): Promise<InstallResult>;
export {};
