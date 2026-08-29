import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { packageRoot, } from '../config/project-root.js';
export function cursorMcpPath(projectRoot, location = 'local') {
    return location === 'global'
        ? path.join(os.homedir(), '.cursor', 'mcp.json')
        : path.join(path.resolve(projectRoot), '.cursor', 'mcp.json');
}
export function installCursorMcp(opts) {
    const root = path.resolve(opts.projectRoot);
    const file = cursorMcpPath(root, opts.location);
    mkdirSync(path.dirname(file), { recursive: true });
    let config = { mcpServers: {} };
    if (existsSync(file)) {
        try {
            config = JSON.parse(readFileSync(file, 'utf8'));
        }
        catch {
            config = { mcpServers: {} };
        }
    }
    if (!config.mcpServers)
        config.mcpServers = {};
    const env = {
        CODEGENKIT_ROOT: root,
        CODEGENKIT_TYPE: opts.type,
    };
    if (opts.feAdapter)
        env.CODEGENKIT_FE_ADAPTER = opts.feAdapter;
    if (opts.beAdapter)
        env.CODEGENKIT_BE_ADAPTER = opts.beAdapter;
    if (opts.docsRoot)
        env.CODEGENKIT_DOCS_ROOT = path.resolve(opts.docsRoot);
    const entry = {
        type: 'stdio',
        command: process.execPath,
        args: [path.join(packageRoot(), 'bin', 'codegenkit-mcp.mjs')],
        env,
    };
    if (JSON.stringify(config.mcpServers.codegenkit) === JSON.stringify(entry)) {
        return { path: file, written: false };
    }
    config.mcpServers.codegenkit = entry;
    writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
    return { path: file, written: true };
}
/** Remove only Codegenkit's key from the shared Cursor MCP config. */
export function uninstallCursorMcp(opts = {}) {
    const file = cursorMcpPath(opts.projectRoot ?? process.cwd(), opts.location);
    const result = {
        path: file,
        dryRun: !opts.yes,
        removed: false,
        absent: false,
        preserved: false,
    };
    if (!existsSync(file)) {
        result.absent = true;
        return result;
    }
    let config;
    try {
        config = JSON.parse(readFileSync(file, 'utf8'));
    }
    catch {
        result.preserved = true;
        return result;
    }
    if (!config.mcpServers || !('codegenkit' in config.mcpServers)) {
        result.absent = true;
        return result;
    }
    result.removed = true;
    if (opts.yes) {
        delete config.mcpServers.codegenkit;
        writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
    }
    return result;
}
//# sourceMappingURL=cursor-mcp.js.map