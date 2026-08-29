import { type TestkitType } from '../config/project-root.js';
export type AgentId = 'claude' | 'cursor' | 'codex' | 'opencode' | 'hermes' | 'gemini' | 'antigravity' | 'kiro' | 'kilo';
export declare const AGENT_IDS: AgentId[];
export interface InstallAgentsOptions {
    projectRoot: string;
    type: TestkitType;
    targets: AgentId[];
    testsRoot?: string;
    docsRoot?: string;
}
export interface InstallAgentsResult {
    targets: AgentId[];
    written: Array<{
        agent: AgentId;
        path: string;
    }>;
}
export interface UninstallAgentsResult {
    dryRun: boolean;
    removed: string[];
    absent: string[];
}
export declare function agentConfigPath(agent: AgentId, projectRoot: string): string;
export declare function detectAgents(projectRoot?: string): AgentId[];
export declare function parseAgentTargets(raw: string | undefined, detected: AgentId[]): AgentId[];
export declare function chooseAgentTargets(opts: {
    projectRoot: string;
    target?: string;
    interactive: boolean;
}): Promise<AgentId[]>;
export declare function installAgents(opts: InstallAgentsOptions): InstallAgentsResult;
export declare function uninstallAgents(opts: {
    projectRoot: string;
    yes?: boolean;
}): UninstallAgentsResult;
