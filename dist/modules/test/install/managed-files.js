import { existsSync, lstatSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
export const TESTKIT_PACKAGE_SCRIPTS = {
    tests: {
        'cases:render': 'testkit cases:render --project-root=. --',
        'check:plans': 'testkit cases:check --project-root=. --',
        'check:coverage': 'testkit cases:coverage --project-root=. --',
        'tests:build': 'pnpm cases:render && vitepress build',
        'tests:dev': 'vitepress dev',
        'tests:preview': 'vitepress preview',
    },
    fe: {
        'testcase:gen': 'testkit testcase:gen --project-root=. --',
        'testcase:gen:dry': 'testkit testcase:gen:dry --project-root=. --',
        'testcase:gen:all': 'testkit testcase:gen --all --project-root=. --',
    },
};
const LEGACY_IGNORE_START = '# testkit managed start';
const LEGACY_IGNORE_END = '# testkit managed end';
function readJsonObject(file) {
    if (!existsSync(file))
        return {};
    try {
        const value = JSON.parse(readFileSync(file, 'utf8'));
        return value && typeof value === 'object' && !Array.isArray(value)
            ? value
            : null;
    }
    catch {
        return null;
    }
}
function eolOf(content) {
    return content.includes('\r\n') ? '\r\n' : '\n';
}
function linesOf(content) {
    return content.split(/\r?\n/);
}
function withoutLegacyBlock(lines) {
    const start = lines.indexOf(LEGACY_IGNORE_START);
    if (start < 0)
        return { lines, changed: false };
    const end = lines.indexOf(LEGACY_IGNORE_END, start + 1);
    if (end < 0)
        throw new Error(`Invalid .gitignore: missing "${LEGACY_IGNORE_END}"`);
    const next = [...lines.slice(0, start), ...lines.slice(end + 1)];
    while (next.length > 1 && next.at(-1) === '' && next.at(-2) === '')
        next.pop();
    return { lines: next, changed: true };
}
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
function hasEquivalentIgnore(lines, entry) {
    const expected = canonicalGitignorePattern(entry);
    return Boolean(expected) && lines.some((line) => {
        const trimmed = line.trim();
        return Boolean(trimmed) && !trimmed.startsWith('#')
            && canonicalGitignorePattern(trimmed) === expected;
    });
}
function relativeTarget(root, target) {
    const relative = path.relative(root, path.resolve(target));
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        return null;
    }
    return relative.split(path.sep).join('/');
}
/**
 * Single source of generated local targets used by init and persisted for
 * status/deinit. Harness and install state are always local; agent paths come
 * only from configurations actually managed by the selected adapters.
 */
export function generatedTargets(opts) {
    const root = path.resolve(opts.projectRoot);
    const targets = [
        '.cursor/',
        '.agents/',
        '.codex/',
        '.claude/',
        '.hermes/',
        '.opencode/',
        '.kiro/',
        '.kilocode/',
        '.testkit/',
        '.docskit/',
    ];
    for (const file of opts.agentPaths ?? []) {
        const relative = relativeTarget(root, file);
        if (!relative)
            continue;
        if (targets.some((target) => target.endsWith('/') && relative.startsWith(target)))
            continue;
        targets.push(relative);
    }
    return [...new Set(targets)];
}
/**
 * Platform DNA gitignore contract: append only missing entries, recognize
 * root-anchored equivalents, preserve member lines and the existing EOL.
 */
export function ensureGitignoreEntries(projectRoot, patterns) {
    const file = path.join(path.resolve(projectRoot), '.gitignore');
    if (existsSync(file) && !lstatSync(file).isFile()) {
        throw new Error(`.gitignore is not a regular file: ${file}`);
    }
    const original = existsSync(file) ? readFileSync(file, 'utf8') : '';
    const eol = eolOf(original);
    const migrated = withoutLegacyBlock(linesOf(original));
    let content = original;
    if (migrated.changed) {
        const trailing = /\r?\n$/.test(original);
        const body = migrated.lines.join(eol);
        content = body && trailing && !body.endsWith(eol) ? `${body}${eol}` : body;
        writeFileSync(file, content, 'utf8');
    }
    const present = new Set(linesOf(content)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map(canonicalGitignorePattern));
    const seen = new Set();
    const added = [];
    for (const pattern of patterns) {
        const canonical = canonicalGitignorePattern(pattern);
        if (!canonical || present.has(canonical) || seen.has(canonical))
            continue;
        seen.add(canonical);
        added.push(pattern.trim());
    }
    if (added.length > 0) {
        const prefix = content.length > 0 && !/\r?\n$/.test(content) ? eol : '';
        writeFileSync(file, `${content}${prefix}${added.join(eol)}${eol}`, 'utf8');
    }
    return { file, added, changed: migrated.changed || added.length > 0 };
}
export function syncManagedRepoFiles(opts) {
    const root = path.resolve(opts.projectRoot);
    const result = {
        managed: {},
        written: [],
        unchanged: [],
        conflicts: [],
    };
    const previousScripts = opts.previous?.packageScripts ?? {};
    const ownedScripts = { ...previousScripts };
    const packageFile = path.join(root, 'package.json');
    const typeScripts = TESTKIT_PACKAGE_SCRIPTS[opts.type];
    if (typeScripts) {
        const document = readJsonObject(packageFile);
        if (!document) {
            result.conflicts.push(packageFile);
        }
        else {
            const scriptsValue = document.scripts;
            if (scriptsValue !== undefined
                && (!scriptsValue || typeof scriptsValue !== 'object' || Array.isArray(scriptsValue))) {
                result.conflicts.push(`${packageFile}#scripts`);
            }
            else {
                const scripts = scriptsValue ?? {};
                let changed = false;
                for (const [name, command] of Object.entries(typeScripts)) {
                    const current = scripts[name];
                    if (current === undefined) {
                        scripts[name] = command;
                        ownedScripts[name] = command;
                        changed = true;
                    }
                    else if (current === command) {
                        if (previousScripts[name] === command)
                            ownedScripts[name] = command;
                    }
                    else {
                        result.conflicts.push(`${packageFile}#scripts.${name}`);
                        delete ownedScripts[name];
                    }
                }
                document.scripts = scripts;
                if (changed) {
                    writeFileSync(packageFile, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
                    result.written.push(packageFile);
                }
                else {
                    result.unchanged.push(packageFile);
                }
            }
        }
    }
    if (Object.keys(ownedScripts).length > 0)
        result.managed.packageScripts = ownedScripts;
    const requestedIgnore = opts.ignoreEntries ?? generatedTargets({ projectRoot: root });
    const seenIgnore = new Set();
    const ensuredIgnore = requestedIgnore.filter((entry) => {
        const canonical = canonicalGitignorePattern(entry);
        if (!canonical || seenIgnore.has(canonical))
            return false;
        seenIgnore.add(canonical);
        return true;
    });
    const gitignore = ensureGitignoreEntries(root, ensuredIgnore);
    if (gitignore.changed)
        result.written.push(gitignore.file);
    else
        result.unchanged.push(gitignore.file);
    if (ensuredIgnore.length > 0)
        result.managed.gitignoreLines = ensuredIgnore;
    return result;
}
export function managedRepoStatus(projectRoot, managed) {
    const result = { healthy: [], missing: [], modified: [] };
    const root = path.resolve(projectRoot);
    const packageFile = path.join(root, 'package.json');
    const document = readJsonObject(packageFile);
    const scripts = document?.scripts;
    for (const [name, command] of Object.entries(managed?.packageScripts ?? {})) {
        const label = `package.json#scripts.${name}`;
        if (scripts?.[name] === undefined)
            result.missing.push(label);
        else if (scripts[name] !== command)
            result.modified.push(label);
        else
            result.healthy.push(label);
    }
    const gitignoreFile = path.join(root, '.gitignore');
    const lines = existsSync(gitignoreFile) ? linesOf(readFileSync(gitignoreFile, 'utf8')) : [];
    for (const line of managed?.gitignoreLines ?? []) {
        const label = `.gitignore#${line}`;
        if (hasEquivalentIgnore(lines, line))
            result.healthy.push(label);
        else
            result.missing.push(label);
    }
    return result;
}
export function removeManagedRepoFiles(opts) {
    const root = path.resolve(opts.projectRoot);
    const result = {
        wouldDelete: [],
        deleted: [],
        preservedModified: [],
        missing: [],
    };
    const packageFile = path.join(root, 'package.json');
    const document = readJsonObject(packageFile);
    const scripts = document?.scripts;
    let packageChanged = false;
    for (const [name, command] of Object.entries(opts.managed?.packageScripts ?? {})) {
        const label = `package.json#scripts.${name}`;
        if (scripts?.[name] === undefined)
            result.missing.push(label);
        else if (scripts[name] !== command)
            result.preservedModified.push(label);
        else if (opts.yes) {
            delete scripts[name];
            result.deleted.push(label);
            packageChanged = true;
        }
        else {
            result.wouldDelete.push(label);
        }
    }
    if (opts.yes && packageChanged && document) {
        writeFileSync(packageFile, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    }
    // Ignore entries are intentionally retained. Targets such as `.cursor/`, `.claude/`, etc.
    // are shared by multiple toolkits, so deinit cannot safely infer exclusive
    // ownership from this toolkit's manifest.
    return result;
}
//# sourceMappingURL=managed-files.js.map