/**
 * Narrow TOML helpers for Codex `~/.codex/config.toml`
 * MCP server tables only — not a general parser.
 */
export function serializeTomlTableBody(values) {
    const lines = [];
    for (const [key, value] of Object.entries(values)) {
        if (typeof value === 'string') {
            lines.push(`${key} = ${quoteString(value)}`);
        }
        else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
            lines.push(`${key} = [${value.map(quoteString).join(', ')}]`);
        }
        else {
            throw new Error(`Unsupported TOML value type for key "${key}"`);
        }
    }
    return lines.join('\n');
}
function quoteString(s) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
export function buildTomlTable(header, values) {
    return `[${header}]\n${serializeTomlTableBody(values)}`;
}
export function upsertTomlTable(fileContent, header, block) {
    const headerLine = `[${header}]`;
    const headerIdx = findHeaderIndex(fileContent, headerLine);
    if (headerIdx === -1) {
        const trimmed = fileContent.trimEnd();
        const sep = trimmed.length > 0 ? '\n\n' : '';
        return {
            content: `${trimmed}${sep}${block}\n`,
            action: 'inserted',
        };
    }
    const endIdx = findBlockEnd(fileContent, headerIdx);
    const existing = fileContent.slice(headerIdx, endIdx);
    const normalizedBlock = block.endsWith('\n') ? block : `${block}\n`;
    if (existing === normalizedBlock || existing === block) {
        return { content: fileContent, action: 'unchanged' };
    }
    return {
        content: fileContent.slice(0, headerIdx) + normalizedBlock + fileContent.slice(endIdx),
        action: 'replaced',
    };
}
export function removeTomlTable(fileContent, header) {
    const headerIdx = findHeaderIndex(fileContent, `[${header}]`);
    if (headerIdx === -1)
        return { content: fileContent, removed: false };
    const endIdx = findBlockEnd(fileContent, headerIdx);
    const next = fileContent.slice(0, headerIdx) + fileContent.slice(endIdx);
    const content = next.replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
    return { content, removed: true };
}
function findHeaderIndex(content, headerLine) {
    const re = new RegExp(`^${escapeRegExp(headerLine)}\\s*(?:#.*)?$`, 'm');
    const m = re.exec(content);
    return m ? m.index : -1;
}
function findBlockEnd(content, headerIdx) {
    const after = content.slice(headerIdx);
    const next = after.search(/\n\[/m);
    if (next === -1)
        return content.length;
    return headerIdx + next + 1;
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=toml.js.map