/**
 * Per-host harness generation profiles.
 *
 * init/installHarness renders harness/templates (or harness/cursor source)
 * into each selected agent's dir — not a blind copy/rename of Cursor assets.
 */
import { AGENT_DIRS } from './agents.js';
const PROFILES = {
    antigravity: {
        label: 'Antigravity IDE',
        readTool: 'view_file',
        writeTool: 'write_to_file',
        overlayFile: 'AGENTS.md',
        preferMdcRules: false,
    },
    cursor: {
        label: 'Cursor',
        readTool: 'Read',
        writeTool: 'Write',
        overlayFile: null, // alwaysApply → rules/agent-compliance.mdc
        preferMdcRules: true,
    },
    claude: {
        label: 'Claude Code',
        readTool: 'Read',
        writeTool: 'Write',
        overlayFile: 'CLAUDE.md',
        preferMdcRules: false,
    },
    codex: {
        label: 'Codex CLI',
        readTool: 'read_file',
        writeTool: 'write_file',
        overlayFile: 'AGENTS.md',
        preferMdcRules: false,
    },
    opencode: {
        label: 'opencode',
        readTool: 'read',
        writeTool: 'write',
        overlayFile: 'AGENTS.md',
        preferMdcRules: false,
    },
    hermes: {
        label: 'Hermes Agent',
        readTool: 'read_file',
        writeTool: 'write_file',
        overlayFile: 'AGENTS.md',
        preferMdcRules: false,
    },
    gemini: {
        label: 'Gemini CLI',
        readTool: 'read_file',
        writeTool: 'write_file',
        overlayFile: 'GEMINI.md',
        preferMdcRules: false,
    },
    kiro: {
        label: 'Kiro',
        readTool: 'readFile',
        writeTool: 'writeFile',
        overlayFile: 'AGENTS.md',
        preferMdcRules: false,
    },
    kilo: {
        label: 'Kilo Code',
        readTool: 'read_file',
        writeTool: 'write_file',
        overlayFile: 'AGENTS.md',
        preferMdcRules: false,
    },
};
export function agentHarnessProfile(id) {
    const base = PROFILES[id];
    if (!base) {
        throw new Error(`No harness profile for agent: ${id}`);
    }
    return { id, dirs: AGENT_DIRS[id] ?? [], ...base };
}
export function profilesForTargets(targets) {
    const ids = targets?.length
        ? targets.map((t) => t).filter((t) => t in PROFILES)
        : ['cursor'];
    const out = [];
    const seen = new Set();
    for (const id of ids) {
        const p = agentHarnessProfile(id);
        for (const dir of p.dirs) {
            const key = `${id}:${dir}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            out.push({ ...p, dirs: [dir] });
        }
    }
    if (!out.length)
        out.push({ ...agentHarnessProfile('cursor'), dirs: ['.cursor'] });
    return out;
}
/** Tokens substituted into harness templates at init time. */
export function renderHarnessTemplate(source, profile, agentDir) {
    const overlay = profile.overlayFile ?? 'rules/agent-compliance.mdc';
    let out = source
        .replaceAll('{{DOC_SKIT_AGENT_ID}}', profile.id)
        .replaceAll('{{DOC_SKIT_AGENT_LABEL}}', profile.label)
        .replaceAll('{{DOC_SKIT_AGENT_DIR}}', agentDir)
        .replaceAll('{{DOC_SKIT_READ_TOOL}}', profile.readTool)
        .replaceAll('{{DOC_SKIT_WRITE_TOOL}}', profile.writeTool)
        .replaceAll('{{DOC_SKIT_OVERLAY_FILE}}', overlay);
    // Legacy hard-coded tool names still present in unmigrated template lines
    if (out.includes('view_file')) {
        out = out.replaceAll('`view_file`', `\`${profile.readTool}\``).replaceAll('view_file', profile.readTool);
    }
    if (out.includes('write_to_file')) {
        out = out
            .replaceAll('`write_to_file`', `\`${profile.writeTool}\``)
            .replaceAll('write_to_file', profile.writeTool);
    }
    if (agentDir !== '.cursor') {
        out = out
            .replaceAll('.cursor/extracts/', `${agentDir}/extracts/`)
            .replaceAll('.cursor/skills/', `${agentDir}/skills/`)
            .replaceAll('.cursor/schemas/', `${agentDir}/schemas/`);
    }
    return out;
}
//# sourceMappingURL=agent-profile.js.map