import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { packageRoot } from '../config/project-root.js';
import { checkboxPrompt } from './prompt.js';
import { buildTomlTable, removeTomlTable, upsertTomlTable } from './toml.js';
export const AGENT_IDS = [
    'claude',
    'cursor',
    'codex',
    'opencode',
    'hermes',
    'gemini',
    'antigravity',
    'kiro',
    'kilo',
];
const AGENT_LABEL = {
    claude: 'Claude Code',
    cursor: 'Cursor',
    codex: 'Codex CLI',
    opencode: 'opencode',
    hermes: 'Hermes Agent',
    gemini: 'Gemini CLI',
    antigravity: 'Antigravity IDE',
    kiro: 'Kiro',
    kilo: 'Kilo Code',
};
const AGENT_ALIASES = {
    claude: 'claude',
    cursor: 'cursor',
    codex: 'codex',
    opencode: 'opencode',
    hermes: 'hermes',
    gemini: 'gemini',
    antigravity: 'antigravity',
    agy: 'antigravity',
    kiro: 'kiro',
    kilo: 'kilo',
};
const MCP_NAME = 'testkit';
function xdgConfigHome() {
    return process.env.XDG_CONFIG_HOME?.trim() || path.join(os.homedir(), '.config');
}
function hermesHome() {
    return process.env.HERMES_HOME
        ? path.resolve(process.env.HERMES_HOME)
        : path.join(os.homedir(), '.hermes');
}
export function agentConfigPath(agent, projectRoot) {
    const root = path.resolve(projectRoot);
    switch (agent) {
        case 'claude':
            return path.join(root, '.claude.json');
        case 'cursor':
            return path.join(root, '.cursor', 'mcp.json');
        case 'codex':
            return path.join(root, '.codex', 'config.toml');
        case 'opencode':
            return existsSync(path.join(root, 'opencode.json'))
                ? path.join(root, 'opencode.json')
                : path.join(root, 'opencode.jsonc');
        case 'hermes':
            return path.join(root, '.hermes', 'config.yaml');
        case 'gemini':
            return path.join(root, '.gemini', 'settings.json');
        case 'antigravity':
            return path.join(root, '.gemini', 'config', 'mcp_config.json');
        case 'kiro':
            return path.join(root, '.kiro', 'settings', 'mcp.json');
        case 'kilo':
            return path.join(root, '.kilocode', 'mcp.json');
    }
}
export function detectAgents(projectRoot = process.cwd()) {
    const root = path.resolve(projectRoot);
    const found = [];
    if (existsSync(path.join(os.homedir(), '.claude'))
        || existsSync(path.join(os.homedir(), '.claude.json'))
        || existsSync(path.join(root, '.claude.json')))
        found.push('claude');
    if (existsSync(path.join(os.homedir(), '.cursor')) || existsSync(path.join(root, '.cursor'))) {
        found.push('cursor');
    }
    if (existsSync(path.join(os.homedir(), '.codex')) || existsSync(path.join(root, '.codex'))) {
        found.push('codex');
    }
    if (existsSync(path.join(xdgConfigHome(), 'opencode'))
        || existsSync(path.join(root, 'opencode.jsonc'))
        || existsSync(path.join(root, 'opencode.json')))
        found.push('opencode');
    if (existsSync(hermesHome()) || existsSync(path.join(root, '.hermes')))
        found.push('hermes');
    if (existsSync(path.join(os.homedir(), '.gemini')) || existsSync(path.join(root, '.gemini'))) {
        found.push('gemini');
    }
    if (existsSync(path.join(os.homedir(), '.antigravity-ide-server'))
        || existsSync(path.join(os.homedir(), '.gemini', 'config'))
        || existsSync(path.join(root, '.gemini', 'config')))
        found.push('antigravity');
    if (existsSync(path.join(os.homedir(), '.kiro')) || existsSync(path.join(root, '.kiro'))) {
        found.push('kiro');
    }
    if (existsSync(path.join(os.homedir(), '.kilocode')) || existsSync(path.join(root, '.kilocode'))) {
        found.push('kilo');
    }
    return found;
}
export function parseAgentTargets(raw, detected) {
    const value = (raw ?? 'auto').trim().toLowerCase();
    if (!value || value === 'auto')
        return detected.length > 0 ? detected : ['cursor'];
    if (value === 'all')
        return [...AGENT_IDS];
    if (value === 'none')
        return [];
    const targets = [];
    for (const item of value.split(/[,\s]+/).filter(Boolean)) {
        const target = AGENT_ALIASES[item];
        if (!target)
            throw new Error(`Unknown agent "${item}". Known: ${AGENT_IDS.join(', ')}`);
        if (!targets.includes(target))
            targets.push(target);
    }
    return targets;
}
export async function chooseAgentTargets(opts) {
    const detected = detectAgents(opts.projectRoot);
    if (!opts.interactive)
        return parseAgentTargets(opts.target, detected);
    const checked = detected.length > 0 ? detected : ['cursor'];
    console.log('testkit init — choose agents\n');
    return checkboxPrompt({
        message: 'Which agents should get Testkit MCP?',
        choices: AGENT_IDS.map((agent) => ({
            value: agent,
            name: detected.includes(agent) ? `${AGENT_LABEL[agent]} (detected)` : AGENT_LABEL[agent],
            checked: checked.includes(agent),
        })),
    });
}
function buildMcpEntry(opts) {
    const root = path.resolve(opts.projectRoot);
    const env = {
        TESTKIT_ROOT: root,
        TESTKIT_TYPE: opts.type,
    };
    if (opts.testsRoot)
        env.TESTKIT_TESTS_ROOT = path.resolve(root, opts.testsRoot);
    if (opts.docsRoot)
        env.TESTKIT_DOCS_ROOT = path.resolve(root, opts.docsRoot);
    return {
        type: 'stdio',
        command: process.execPath,
        args: [path.join(packageRoot(), 'bin', 'testkit-mcp.mjs')],
        env,
    };
}
function jsonDocument(file) {
    if (!existsSync(file))
        return {};
    const raw = readFileSync(file, 'utf8');
    if (!raw.trim())
        return {};
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new Error(`Cannot merge invalid JSON agent config: ${file}`);
    }
}
function mergeMcpJson(file, entry, omitType = false) {
    const document = jsonDocument(file);
    const servers = document.mcpServers ?? {};
    servers[MCP_NAME] = omitType
        ? { command: entry.command, args: entry.args, env: entry.env }
        : entry;
    document.mcpServers = servers;
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    return file;
}
function mergeCodex(file, entry) {
    mkdirSync(path.dirname(file), { recursive: true });
    let content = existsSync(file) ? readFileSync(file, 'utf8') : '';
    content = upsertTomlTable(content, `mcp_servers.${MCP_NAME}`, buildTomlTable(`mcp_servers.${MCP_NAME}`, { command: entry.command, args: entry.args }));
    const envHeader = `mcp_servers.${MCP_NAME}.env`;
    const envBody = Object.entries(entry.env).map(([key, value]) => `${key} = ${JSON.stringify(value)}`);
    content = upsertTomlTable(content, envHeader, `[${envHeader}]\n${envBody.join('\n')}`);
    writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
    return file;
}
function parseJsonc(file) {
    if (!existsSync(file))
        return {};
    const raw = readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '');
    if (!raw.trim())
        return {};
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new Error(`Cannot merge invalid JSONC agent config: ${file}`);
    }
}
function mergeOpencode(file, entry) {
    const document = parseJsonc(file);
    document.$schema ??= 'https://opencode.ai/config.json';
    const mcp = document.mcp ?? {};
    mcp[MCP_NAME] = {
        type: 'local',
        command: [entry.command, ...entry.args],
        enabled: true,
        environment: entry.env,
    };
    document.mcp = mcp;
    writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    return file;
}
function yamlDocument(file) {
    if (!existsSync(file))
        return {};
    const raw = readFileSync(file, 'utf8');
    if (!raw.trim())
        return {};
    try {
        return parseYaml(raw) ?? {};
    }
    catch {
        throw new Error(`Cannot merge invalid YAML agent config: ${file}`);
    }
}
function mergeHermes(file, entry) {
    const document = yamlDocument(file);
    const servers = document.mcp_servers ?? {};
    servers[MCP_NAME] = {
        command: entry.command,
        args: entry.args,
        env: entry.env,
        timeout: 120,
        connect_timeout: 60,
        enabled: true,
    };
    document.mcp_servers = servers;
    const toolsets = document.platform_toolsets ?? {};
    const cli = Array.isArray(toolsets.cli) ? [...toolsets.cli] : ['hermes-cli'];
    if (!cli.includes(`mcp-${MCP_NAME}`))
        cli.push(`mcp-${MCP_NAME}`);
    toolsets.cli = cli;
    document.platform_toolsets = toolsets;
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, stringifyYaml(document), 'utf8');
    return file;
}
function mergeClaudePermissions(projectRoot) {
    const file = path.join(projectRoot, '.claude', 'settings.json');
    const document = jsonDocument(file);
    document.permissions ??= {};
    document.permissions.allow ??= [];
    const permission = `mcp__${MCP_NAME}__*`;
    if (document.permissions.allow.includes(permission))
        return null;
    document.permissions.allow.push(permission);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    return file;
}
export function installAgents(opts) {
    const entry = buildMcpEntry(opts);
    const written = [];
    for (const agent of opts.targets) {
        const file = agentConfigPath(agent, opts.projectRoot);
        switch (agent) {
            case 'codex':
                mergeCodex(file, entry);
                break;
            case 'opencode':
                mergeOpencode(file, entry);
                break;
            case 'hermes':
                mergeHermes(file, entry);
                break;
            default:
                mergeMcpJson(file, entry, agent === 'antigravity');
        }
        written.push({ agent, path: file });
        if (agent === 'claude') {
            const permissions = mergeClaudePermissions(path.resolve(opts.projectRoot));
            if (permissions)
                written.push({ agent, path: permissions });
        }
    }
    return { targets: opts.targets, written };
}
function removeJsonMcp(file, dryRun) {
    let document;
    try {
        document = jsonDocument(file);
    }
    catch {
        return false;
    }
    const servers = document.mcpServers;
    if (!servers || !(MCP_NAME in servers))
        return false;
    if (!dryRun) {
        delete servers[MCP_NAME];
        writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    }
    return true;
}
function removeCodex(file, dryRun) {
    if (!existsSync(file))
        return false;
    const server = removeTomlTable(readFileSync(file, 'utf8'), `mcp_servers.${MCP_NAME}`);
    const env = removeTomlTable(server.content, `mcp_servers.${MCP_NAME}.env`);
    if (!server.removed && !env.removed)
        return false;
    if (!dryRun)
        writeFileSync(file, env.content.endsWith('\n') ? env.content : `${env.content}\n`);
    return true;
}
function removeOpencode(file, dryRun) {
    let document;
    try {
        document = parseJsonc(file);
    }
    catch {
        return false;
    }
    const mcp = document.mcp;
    if (!mcp || !(MCP_NAME in mcp))
        return false;
    if (!dryRun) {
        delete mcp[MCP_NAME];
        writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    }
    return true;
}
function removeHermes(file, dryRun) {
    let document;
    try {
        document = yamlDocument(file);
    }
    catch {
        return false;
    }
    const servers = document.mcp_servers;
    const toolsets = document.platform_toolsets;
    const cli = toolsets && Array.isArray(toolsets.cli) ? toolsets.cli : [];
    const hasServer = Boolean(servers && MCP_NAME in servers);
    const hasTool = cli.includes(`mcp-${MCP_NAME}`);
    if (!hasServer && !hasTool)
        return false;
    if (!dryRun) {
        if (hasServer)
            delete servers[MCP_NAME];
        if (hasTool)
            toolsets.cli = cli.filter((item) => item !== `mcp-${MCP_NAME}`);
        writeFileSync(file, stringifyYaml(document), 'utf8');
    }
    return true;
}
function removeClaudePermissions(projectRoot, dryRun) {
    const file = path.join(projectRoot, '.claude', 'settings.json');
    let document;
    try {
        document = jsonDocument(file);
    }
    catch {
        return null;
    }
    const permission = `mcp__${MCP_NAME}__*`;
    const allow = document.permissions?.allow;
    if (!allow?.includes(permission))
        return null;
    if (!dryRun) {
        document.permissions.allow = allow.filter((item) => item !== permission);
        writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    }
    return file;
}
export function uninstallAgents(opts) {
    const root = path.resolve(opts.projectRoot);
    const dryRun = !opts.yes;
    const removed = [];
    const absent = [];
    for (const agent of AGENT_IDS) {
        const file = agentConfigPath(agent, root);
        const didRemove = agent === 'codex'
            ? removeCodex(file, dryRun)
            : agent === 'opencode'
                ? removeOpencode(file, dryRun)
                : agent === 'hermes'
                    ? removeHermes(file, dryRun)
                    : removeJsonMcp(file, dryRun);
        if (didRemove)
            removed.push(`${agent}: ${file}`);
        else
            absent.push(`${agent}: no ${MCP_NAME} entry`);
        if (agent === 'claude') {
            const permissions = removeClaudePermissions(root, dryRun);
            if (permissions)
                removed.push(`claude: ${permissions} (permissions)`);
        }
    }
    return { dryRun, removed, absent };
}
//# sourceMappingURL=agents.js.map