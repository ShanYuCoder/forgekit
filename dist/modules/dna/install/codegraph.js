import { existsSync, readFileSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mergeMcpServers } from './mcp-config.js';
const LOCAL_MAPS = [
    { file: 'platform-repos.local.json', source: 'platform' },
    { file: 'legacy-repos.local.json', source: 'legacy' },
];
export function isWsl() {
    return Boolean(process.env.WSL_DISTRO_NAME) || /microsoft/i.test(os.release());
}
/**
 * Resolve a declared root to a path usable in the *current* runtime. In WSL a
 * `D:\...` value is rewritten to `/mnt/d/...`; on plain Linux a Windows-style
 * path fails closed (never written verbatim into a command run under WSL).
 */
export function normalizeRuntimePath(input) {
    const raw = input.trim();
    if (!raw)
        return { error: 'empty root' };
    const drive = /^([A-Za-z]):[\\/](.*)$/.exec(raw);
    if (drive) {
        if (isWsl()) {
            const rest = drive[2].replace(/\\/g, '/').replace(/\/+/g, '/');
            return { path: path.posix.normalize(`/mnt/${drive[1].toLowerCase()}/${rest}`) };
        }
        if (process.platform === 'win32')
            return { path: path.win32.normalize(raw) };
        return { error: `Windows path not usable in this runtime: ${raw}` };
    }
    if (raw.includes('\\') && process.platform !== 'win32') {
        return { error: `backslash path not usable in this runtime: ${raw}` };
    }
    return { path: raw };
}
function extractProjects(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data))
        return {};
    const record = data;
    const projects = record.projects;
    if (projects && typeof projects === 'object' && !Array.isArray(projects)) {
        return projects;
    }
    return record;
}
export function readRepoRefs(root) {
    const base = path.resolve(root);
    // Platform map is listed first so duplicate keys prefer platform (legacy-only
    // keys typically use the `legacy-*` prefix and appear only in the legacy map).
    const byKey = new Map();
    for (const { file, source } of LOCAL_MAPS) {
        const mapPath = path.join(base, file);
        if (!existsSync(mapPath))
            continue;
        let data;
        try {
            data = JSON.parse(readFileSync(mapPath, 'utf8'));
        }
        catch {
            continue;
        }
        for (const [key, value] of Object.entries(extractProjects(data))) {
            if (byKey.has(key))
                continue;
            const rootValue = value?.root;
            if (typeof rootValue === 'string' && rootValue.trim()) {
                byKey.set(key, { key, root: rootValue.trim(), source });
            }
        }
    }
    return [...byKey.values()];
}
export function codegraphCommand() {
    return process.env.PLATFORM_DNA_CODEGRAPH_COMMAND?.trim() || 'codegraph';
}
export function codegraphServerEntry(root) {
    return {
        type: 'stdio',
        command: codegraphCommand(),
        args: ['mcp', '--project-root', root],
    };
}
/**
 * Build the wiring plan. `selfRoot` (the repo being initialized) is excluded by
 * default so cross-index only targets *other* repos; `filterKeys` narrows the
 * set further so init never wires every checkout.
 */
export function planCodegraphServers(opts) {
    const selfRoot = path.resolve(opts.root);
    const refs = opts.refs ?? readRepoRefs(selfRoot);
    const filter = opts.filterKeys?.length ? new Set(opts.filterKeys) : undefined;
    const plan = { wire: [], skipped: [], needsIndex: [] };
    const byName = new Map();
    for (const ref of refs) {
        if (filter && !filter.has(ref.key))
            continue;
        const name = `codegraph-${ref.key}`;
        const normalized = normalizeRuntimePath(ref.root);
        const server = {
            key: ref.key,
            name,
            root: normalized.path ?? ref.root,
            source: ref.source,
            exists: false,
            hasIndex: false,
        };
        if (normalized.error) {
            server.skipped = normalized.error;
            register(server);
            continue;
        }
        const abs = path.resolve(normalized.path);
        server.root = abs;
        if (!opts.includeSelf && abs === selfRoot) {
            server.skipped = 'current repo (wire its own index via `codegraph init` locally)';
            register(server);
            continue;
        }
        server.exists = existsSync(abs) && statSync(abs).isDirectory();
        server.hasIndex = server.exists && existsSync(path.join(abs, '.codegraph'));
        if (!server.exists) {
            server.skipped = `root not found: ${abs}`;
            register(server);
            continue;
        }
        const existing = byName.get(name);
        if (existing && existing.root !== abs) {
            server.skipped = `name collision with ${existing.source} entry for "${ref.key}"`;
            plan.skipped.push(server);
            continue;
        }
        if (!server.hasIndex) {
            // Contract: only wire checkouts that already have `.codegraph/`. A repo
            // that exists but is not indexed is never merged into mcp.json (a server
            // pointing at a missing index would just fail); surface the exact init
            // hint via needsIndex so status can nag without wiring anything.
            plan.needsIndex.push({
                key: ref.key,
                root: abs,
                hint: `cd ${abs} && ${codegraphCommand()} init`,
            });
            continue;
        }
        register(server);
    }
    return plan;
    function register(server) {
        if (server.skipped) {
            plan.skipped.push(server);
            return;
        }
        // Only indexed repos reach here; wire exactly one server per name.
        byName.set(server.name, server);
        plan.wire.push(server);
    }
}
export const CODEGRAPH_MCP_FILE = '.cursor/mcp.json';
/**
 * Plan and (unless dry-run) merge the per-repo CodeGraph servers into the repo's
 * local `.cursor/mcp.json`. Returns the manifest fragment describing exactly the
 * servers we own, so status/deinit can verify and unwire them precisely.
 */
export function wireCodegraph(opts) {
    const plan = planCodegraphServers(opts);
    const mcpFile = CODEGRAPH_MCP_FILE;
    if (!plan.wire.length || opts.dryRun)
        return { plan, mcpFile };
    const file = path.join(path.resolve(opts.root), mcpFile);
    const servers = Object.fromEntries(plan.wire.map((server) => [server.name, codegraphServerEntry(server.root)]));
    const merge = mergeMcpServers(file, servers);
    const manifestMcp = {
        file: mcpFile,
        servers: Object.fromEntries(Object.entries(merge.hashes).map(([name, sha256]) => [name, { sha256 }])),
    };
    return { plan, mcpFile, merge, manifestMcp };
}
//# sourceMappingURL=codegraph.js.map