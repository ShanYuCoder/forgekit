/**
 * MCP tool registrations.
 *
 * Tool naming: artifactgraph_<verb> — mirrors CodeGraph style.
 * Each handler: resolve project → load config → local work → JSON text result.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/** Register all tools on the server. */
export declare function registerTools(server: McpServer): void;
