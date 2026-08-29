/**
 * MCP server entry — stdio transport for Cursor.
 *
 * Pattern to copy for future MCPs:
 * 1. Create McpServer
 * 2. Register tools with zod schemas
 * 3. connect(StdioServerTransport)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/** Build the MCP server instance (also usable in tests without connecting). */
export declare function createServer(): McpServer;
/** Process entry when run as `node dist/mcp/server.js` or `tsx src/mcp/server.ts`. */
export declare function main(): Promise<void>;
