/**
 * Idempotent merge of MCP `stdio` servers into a repo-local `.cursor/mcp.json`.
 * Only the named servers are ever touched; every other member/toolkit entry is
 * preserved byte-for-byte. Ownership is proven by hashing the exact entry we
 * wrote, so deinit removes a server only when it still matches what was wired.
 */
export interface McpStdioEntry {
    type?: 'stdio';
    command: string;
    args: string[];
    env?: Record<string, string>;
}
export interface McpMergeResult {
    file: string;
    added: string[];
    updated: string[];
    unchanged: string[];
    /** sha256 of each written entry, keyed by server name — record in the manifest. */
    hashes: Record<string, string>;
}
export interface McpRemoveResult {
    file: string;
    removed: string[];
    preservedModified: string[];
    missing: string[];
}
export declare function mcpEntryHash(entry: unknown): string;
export declare function mergeMcpServers(file: string, servers: Record<string, McpStdioEntry>): McpMergeResult;
/**
 * Remove owned servers only when the current entry still hashes to the recorded
 * value. Member-modified entries are preserved and reported.
 */
export declare function removeMcpServers(file: string, expected: Record<string, string>, opts?: {
    dryRun?: boolean;
}): McpRemoveResult;
