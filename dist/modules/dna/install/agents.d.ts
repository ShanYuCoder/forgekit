export declare const agentIds: readonly ["claude", "cursor", "codex", "opencode", "hermes", "gemini", "antigravity", "kiro", "kilo"];
export type AgentId = (typeof agentIds)[number];
export declare const agentNames: Record<AgentId, string>;
export declare const agentDirs: Record<AgentId, string>;
export declare function detectAgents(cwd?: string): AgentId[];
export declare function parseAgentTargets(raw: string | undefined, detected: AgentId[], fallback?: AgentId[]): AgentId[];
