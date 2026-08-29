import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
function canonicalJson(value) {
    if (Array.isArray(value))
        return `[${value.map(canonicalJson).join(',')}]`;
    if (value && typeof value === 'object') {
        const entries = Object.entries(value)
            .filter(([, v]) => v !== undefined)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`);
        return `{${entries.join(',')}}`;
    }
    return JSON.stringify(value ?? null);
}
export function mcpEntryHash(entry) {
    return createHash('sha256').update(canonicalJson(entry)).digest('hex');
}
function readConfig(file) {
    if (!existsSync(file))
        return { data: {}, existed: false };
    if (!lstatSync(file).isFile()) {
        throw new Error(`MCP config is not a regular file: ${file}`);
    }
    const raw = readFileSync(file, 'utf8').trim();
    if (!raw)
        return { data: {}, existed: true };
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(`MCP config must be a JSON object: ${file}`);
    }
    return { data: parsed, existed: true };
}
function serverBag(data) {
    const existing = data.mcpServers;
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
        return existing;
    }
    return {};
}
export function mergeMcpServers(file, servers) {
    const { data } = readConfig(file);
    const bag = { ...serverBag(data) };
    const result = {
        file,
        added: [],
        updated: [],
        unchanged: [],
        hashes: {},
    };
    for (const [name, entry] of Object.entries(servers)) {
        const next = { type: 'stdio', ...entry };
        result.hashes[name] = mcpEntryHash(next);
        if (!(name in bag))
            result.added.push(name);
        else if (mcpEntryHash(bag[name]) === result.hashes[name]) {
            result.unchanged.push(name);
            continue;
        }
        else
            result.updated.push(name);
        bag[name] = next;
    }
    if (!result.added.length && !result.updated.length)
        return result;
    data.mcpServers = bag;
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    return result;
}
/**
 * Remove owned servers only when the current entry still hashes to the recorded
 * value. Member-modified entries are preserved and reported.
 */
export function removeMcpServers(file, expected, opts = {}) {
    const result = { file, removed: [], preservedModified: [], missing: [] };
    if (!existsSync(file)) {
        result.missing.push(...Object.keys(expected));
        return result;
    }
    const { data } = readConfig(file);
    const bag = { ...serverBag(data) };
    let changed = false;
    for (const [name, sha] of Object.entries(expected)) {
        if (!(name in bag)) {
            result.missing.push(name);
            continue;
        }
        if (mcpEntryHash(bag[name]) !== sha) {
            result.preservedModified.push(name);
            continue;
        }
        result.removed.push(name);
        if (!opts.dryRun) {
            delete bag[name];
            changed = true;
        }
    }
    if (changed) {
        if (Object.keys(bag).length)
            data.mcpServers = bag;
        else
            delete data.mcpServers;
        writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    }
    return result;
}
//# sourceMappingURL=mcp-config.js.map