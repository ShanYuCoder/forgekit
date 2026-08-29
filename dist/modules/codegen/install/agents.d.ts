/**
 * Wire Codegenkit MCP into supported agent configurations (local only).
 *
 * Agents: claude | cursor | codex | opencode | hermes | gemini | antigravity | kiro | kilo
 */
import { type BeAdapterId, type CodegenType, type FeAdapterId } from '../config/project-root.js';
export type AgentId = 'claude' | 'cursor' | 'codex' | 'opencode' | 'hermes' | 'gemini' | 'antigravity' | 'kiro' | 'kilo';
export declare const AGENT_IDS: AgentId[];
export declare const AGENT_DIRS: Record<AgentId, string[]>;
export declare const AGENT_LABEL: Record<AgentId, string>;
export declare const MCP_NAME = "codegenkit";
export interface InstallAgentsOptions {
    projectRoot: string;
    type: CodegenType;
    targets: AgentId[];
    feAdapter?: FeAdapterId;
    beAdapter?: BeAdapterId;
    docsRoot?: string;
}
export interface AgentMcpOwnership {
    file: string;
    sha256: string;
}
export interface InstallAgentsResult {
    targets: AgentId[];
    written: Array<{
        agent: AgentId;
        path: string;
    }>;
    /** Repo-relative ownership keyed by agent id for the install manifest. */
    mcp: Record<string, AgentMcpOwnership>;
}
export interface UninstallAgentsResult {
    dryRun: boolean;
    removed: string[];
    removedPaths: string[];
    absent: string[];
    preserved: string[];
}
export declare function mcpEntryHash(entry: unknown): string;
export declare function agentConfigPath(agent: AgentId, projectRoot: string): string;
export declare function detectAgents(projectRoot?: string): AgentId[];
export declare function parseAgentTargets(raw: string | undefined, detected: AgentId[]): AgentId[];
export declare function installAgents(opts: InstallAgentsOptions): InstallAgentsResult;
/**
 * Uninstall Codegenkit MCP entries. When `recorded` is provided, only those
 * agents are considered and JSON MCP entries are hash-gated.
 */
export declare function uninstallAgents(opts: {
    projectRoot: string;
    yes?: boolean;
    /** Manifest-recorded ownership; when absent, probe all agents by key. */
    recorded?: Record<string, AgentMcpOwnership>;
}): UninstallAgentsResult;
/** Read current JSON MCP entry hash (Cursor and similar). */
export declare function currentJsonMcpHash(file: string): string | null;
