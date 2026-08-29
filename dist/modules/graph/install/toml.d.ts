/**
 * Narrow TOML helpers for Codex `~/.codex/config.toml`
 * (`[mcp_servers.artifactgraph]` only — not a general parser).
 */
export declare function serializeTomlTableBody(values: Record<string, string | string[]>): string;
export declare function buildTomlTable(header: string, values: Record<string, string | string[]>): string;
export declare function upsertTomlTable(fileContent: string, header: string, block: string): {
    content: string;
    action: 'inserted' | 'replaced' | 'unchanged';
};
export declare function removeTomlTable(fileContent: string, header: string): {
    content: string;
    removed: boolean;
};
