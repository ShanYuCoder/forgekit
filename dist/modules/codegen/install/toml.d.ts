/**
 * Narrow TOML helpers for Codex `config.toml` MCP server tables only.
 */
export declare function buildTomlTable(header: string, values: Record<string, string | string[]>): string;
export declare function upsertTomlTable(content: string, header: string, block: string): string;
export declare function removeTomlTable(content: string, header: string): {
    content: string;
    removed: boolean;
};
