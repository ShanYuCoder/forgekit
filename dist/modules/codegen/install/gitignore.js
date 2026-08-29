import { existsSync, lstatSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { AGENT_DIRS } from './agents.js';
const LEGACY_START = '# >>> codegenkit generated files';
const LEGACY_END = '# <<< codegenkit generated files';
/**
 * Canonical form so `.cursor/`, `/.cursor/` and `.cursor` compare equal.
 */
export function canonicalGitignorePattern(pattern) {
    let value = pattern.trim();
    if (!value)
        return '';
    let negated = false;
    if (value.startsWith('!')) {
        negated = true;
        value = value.slice(1);
    }
    value = value.replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
    return `${negated ? '!' : ''}${value}`;
}
function detectEol(content) {
    return /\r\n/.test(content) ? '\r\n' : '\n';
}
function presentPatterns(content) {
    const set = new Set();
    for (const raw of content.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#'))
            continue;
        set.add(canonicalGitignorePattern(line));
    }
    return set;
}
function gitignorePath(root) {
    const file = path.join(path.resolve(root), '.gitignore');
    if (existsSync(file) && !lstatSync(file).isFile()) {
        throw new Error(`.gitignore is not a regular file: ${file}`);
    }
    return file;
}
function linesOf(content) {
    return content.split(/\r?\n/);
}
function withoutLegacyBlock(lines) {
    const start = lines.indexOf(LEGACY_START);
    if (start < 0)
        return { lines, changed: false };
    const end = lines.indexOf(LEGACY_END, start + 1);
    if (end < 0)
        throw new Error(`Invalid .gitignore: missing "${LEGACY_END}"`);
    // Keep the entries that lived inside the block — only strip markers.
    const kept = [
        ...lines.slice(0, start),
        ...lines.slice(start + 1, end).filter((line) => {
            const trimmed = line.trim();
            return trimmed.length > 0;
        }),
        ...lines.slice(end + 1),
    ];
    while (kept.length > 1 && kept.at(-1) === '' && kept.at(-2) === '')
        kept.pop();
    return { lines: kept, changed: true };
}
/**
 * Ensure every pattern is present exactly once. Creates the file when missing,
 * migrates the legacy owned block once, preserves member content and EOL.
 */
export function ensureGitignoreEntries(root, patterns) {
    const file = gitignorePath(root);
    const existed = existsSync(file);
    const original = existed ? readFileSync(file, 'utf8') : '';
    const eol = existed ? detectEol(original) : '\n';
    const migrated = withoutLegacyBlock(linesOf(original));
    let content = original;
    if (migrated.changed) {
        const trailing = /\r?\n$/.test(original);
        const body = migrated.lines.join(eol);
        content = body && trailing && !body.endsWith(eol) ? `${body}${eol}` : body;
        writeFileSync(file, content, 'utf8');
    }
    const present = presentPatterns(content);
    const seen = new Set();
    const added = [];
    for (const pattern of patterns) {
        const canonical = canonicalGitignorePattern(pattern);
        if (!canonical || present.has(canonical) || seen.has(canonical))
            continue;
        seen.add(canonical);
        added.push(pattern.trim());
    }
    if (!added.length)
        return { file, added: [], changed: migrated.changed };
    const prefix = content.length > 0 && !/\r?\n$/.test(content) ? eol : '';
    writeFileSync(file, `${content}${prefix}${added.join(eol)}${eol}`);
    return { file, added, changed: true };
}
/**
 * Remove the given patterns (matched by equivalence) while preserving unrelated
 * member lines and the file's dominant EOL.
 */
export function removeGitignoreEntries(root, patterns) {
    const file = gitignorePath(root);
    if (!existsSync(file))
        return { removed: [], changed: false };
    const content = readFileSync(file, 'utf8');
    const eol = detectEol(content);
    const drop = new Set(patterns.map(canonicalGitignorePattern).filter(Boolean));
    const hadTrailingNewline = /\r?\n$/.test(content);
    const removed = [];
    const kept = [];
    for (const raw of content.split(/\r?\n/)) {
        const trimmed = raw.trim();
        const canonical = trimmed && !trimmed.startsWith('#') ? canonicalGitignorePattern(trimmed) : '';
        if (canonical && drop.has(canonical)) {
            removed.push(trimmed);
            continue;
        }
        kept.push(raw);
    }
    if (!removed.length)
        return { file, removed: [], changed: false };
    if (hadTrailingNewline && kept[kept.length - 1] === '')
        kept.pop();
    const body = kept.join(eol);
    writeFileSync(file, body.length && hadTrailingNewline ? `${body}${eol}` : body);
    return { file, removed, changed: true };
}
function isWithin(root, candidate) {
    const absRoot = path.resolve(root);
    const abs = path.resolve(candidate);
    return abs === absRoot || abs.startsWith(`${absRoot}${path.sep}`);
}
/**
 * Map a repo-local written path to the coarsest ignore entry Codegenkit should own.
 */
export function ignorePatternForLocalPath(projectRoot, absolutePath) {
    const cleaned = absolutePath.replace(/ \(permissions\)$/, '');
    if (!isWithin(projectRoot, cleaned))
        return undefined;
    const rel = path.relative(path.resolve(projectRoot), path.resolve(cleaned));
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel))
        return undefined;
    const posix = rel.split(path.sep).join('/');
    if (posix === 'src/.codegenkit' || posix.startsWith('src/.codegenkit/')) {
        return 'src/.codegenkit/';
    }
    const top = posix.split('/')[0];
    if (!top)
        return undefined;
    if (top === '.cursor')
        return '.cursor/';
    if (top === '.codegenkit')
        return '.codegenkit/';
    if (top === '.claude.json')
        return '.claude.json';
    if (top === '.claude')
        return '.claude/';
    if (top === '.codex')
        return '.codex/';
    if (top === '.hermes')
        return '.hermes/';
    if (top === '.gemini')
        return '.gemini/';
    if (top === '.kiro')
        return '.kiro/';
    if (top === '.kilocode')
        return '.kilocode/';
    if (top === 'opencode.json')
        return 'opencode.json';
    if (top === 'opencode.jsonc')
        return 'opencode.jsonc';
    return undefined;
}
/**
 * Single source of truth for ignore entries produced by a Codegenkit init run.
 * Only local, actually-written toolkit targets; never product `src/`/`generated/`
 * or `.codegraph*`.
 */
export function generatedTargets(input) {
    const byCanonical = new Map();
    const add = (pattern, shared) => {
        const canonical = canonicalGitignorePattern(pattern);
        if (!canonical)
            return;
        const existing = byCanonical.get(canonical);
        byCanonical.set(canonical, {
            pattern: existing?.pattern ?? pattern,
            ...(shared || existing?.shared ? { shared: true } : {}),
        });
    };
    if (input.harnessInstalled) {
        const agentDirList = input.targets?.flatMap((target) => AGENT_DIRS[target] || []) || [];
        const dirs = agentDirList.length > 0 ? Array.from(new Set(agentDirList)) : ['.cursor'];
        for (const dir of dirs) {
            add(`${dir}/`, true);
        }
        add('.codegenkit/', false);
    }
    if (input.beAdapter === 'laravel') {
        add('src/.codegenkit/', false);
    }
    for (const file of input.written) {
        const pattern = ignorePatternForLocalPath(input.projectRoot, file);
        if (!pattern)
            continue;
        const allowedDirs = Array.from(new Set(Object.values(AGENT_DIRS).flat()));
        const shared = allowedDirs.some(dir => canonicalGitignorePattern(pattern) === canonicalGitignorePattern(`${dir}/`));
        add(pattern, shared);
    }
    return [...byCanonical.values()];
}
/**
 * Merge previous + next owned ignore entries. `shared` wins if either side
 * marks the pattern shared.
 */
export function mergeOwnedGitignore(previous, next) {
    const byCanonical = new Map();
    for (const entry of [...(previous ?? []), ...(next ?? [])]) {
        const canonical = canonicalGitignorePattern(entry.pattern);
        if (!canonical)
            continue;
        const existing = byCanonical.get(canonical);
        byCanonical.set(canonical, {
            pattern: existing?.pattern ?? entry.pattern,
            ...(entry.shared || existing?.shared ? { shared: true } : {}),
        });
    }
    return [...byCanonical.values()];
}
//# sourceMappingURL=gitignore.js.map