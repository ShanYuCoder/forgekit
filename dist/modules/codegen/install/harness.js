import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync, } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { packageRoot, packageVersion, } from '../config/project-root.js';
import { AGENT_DIRS } from './agents.js';
import { canonicalGitignorePattern, ensureGitignoreEntries, mergeOwnedGitignore, removeGitignoreEntries, } from './gitignore.js';
import { forgetInstall, recordInstall } from './ledger.js';
export const FE_SKILLS = [
    'gen-common',
    'prototype',
    'wire',
    'unit',
    'grill-prototype',
    'grill-unit',
    'model',
];
export const BE_SKILLS = ['api', 'grill-api', 'api-unit', 'grill-api-unit'];
const LINE_SKIP_SKILLS = ['model', 'gen-common'];
/** `/model` and `/gen-common` are web-FE only; WinForms Line skips them. */
export function feSkillsForAdapter(adapter) {
    if (adapter === 'dotnet-line') {
        return FE_SKILLS.filter((id) => !LINE_SKIP_SKILLS.includes(id));
    }
    return FE_SKILLS;
}
function skipHarnessRel(opts) {
    if (opts.adapters.fe !== 'dotnet-line')
        return false;
    const rel = opts.rel.split(path.sep).join('/');
    return LINE_SKIP_SKILLS.some((id) => rel.startsWith(`skills/${id}/`));
}
function hash(content) {
    return createHash('sha256').update(content).digest('hex');
}
/** Product-root engine trees retired in favor of toolkit package engines. */
function legacyProductEngineRoots(root) {
    const legacy = ['contractgen'];
    return legacy
        .map((name) => path.join(root, name))
        .filter((candidate) => {
        if (!existsSync(candidate))
            return false;
        // Treat as toolkit leftover when it still has runners/ (old product engine).
        return existsSync(path.join(candidate, 'runners'));
    });
}
function lexists(file) {
    try {
        lstatSync(file);
        return true;
    }
    catch {
        return false;
    }
}
function managedPath(root, relative) {
    const target = path.resolve(root, ...relative.split('/'));
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
        throw new Error(`Managed Codegenkit path escapes project root: ${relative}`);
    }
    let existing = target;
    while (!lexists(existing) && existing !== root)
        existing = path.dirname(existing);
    const realRoot = realpathSync(root);
    const realExisting = realpathSync(existing);
    if (realExisting !== realRoot && !realExisting.startsWith(`${realRoot}${path.sep}`)) {
        throw new Error(`Managed Codegenkit path escapes project root through a symlink: ${relative}`);
    }
    return target;
}
function walk(root) {
    if (!existsSync(root))
        return [];
    const out = [];
    for (const name of readdirSync(root)) {
        const file = path.join(root, name);
        if (statSync(file).isDirectory())
            out.push(...walk(file));
        else
            out.push(file);
    }
    return out;
}
export function manifestFile(root) {
    return path.join(root, '.codegenkit', 'install-manifest.json');
}
/** Public read of the install manifest (null when absent). */
export function readInstallManifest(projectRoot) {
    return readManifest(path.resolve(projectRoot ?? process.cwd()));
}
function validateManifestGitignore(value) {
    if (value === undefined)
        return [];
    if (!Array.isArray(value)) {
        throw new Error('Invalid Codegenkit install manifest gitignore');
    }
    const seen = new Set();
    const entries = [];
    for (const raw of value) {
        if (!raw
            || typeof raw !== 'object'
            || typeof raw.pattern !== 'string'
            || !raw.pattern.trim()
            || /[\r\n]/.test(raw.pattern)) {
            throw new Error('Invalid Codegenkit install manifest gitignore entry');
        }
        if (raw.shared !== undefined
            && typeof raw.shared !== 'boolean') {
            throw new Error('Invalid Codegenkit install manifest gitignore shared flag');
        }
        const pattern = raw.pattern.trim();
        const canonical = canonicalGitignorePattern(pattern);
        if (!canonical || seen.has(canonical))
            continue;
        seen.add(canonical);
        entries.push({
            pattern,
            ...(raw.shared ? { shared: true } : {}),
        });
    }
    return entries;
}
function validateManifestMcp(value) {
    if (value === undefined)
        return undefined;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Invalid Codegenkit install manifest mcp');
    }
    const out = {};
    for (const [agent, raw] of Object.entries(value)) {
        if (!raw
            || typeof raw !== 'object'
            || typeof raw.file !== 'string'
            || !raw.file.trim()
            || path.isAbsolute(raw.file)
            || raw.file.includes('\\')
            || raw.file.split('/').some((part) => part === '' || part === '.' || part === '..')
            || typeof raw.sha256 !== 'string'
            || !/^[a-f0-9]{64}$/.test(raw.sha256)) {
            throw new Error(`Invalid Codegenkit install manifest mcp entry: ${agent}`);
        }
        out[agent] = {
            file: raw.file,
            sha256: raw.sha256,
        };
    }
    return Object.keys(out).length ? out : undefined;
}
function readManifest(root, allowIncompatible = false) {
    const file = managedPath(root, '.codegenkit/install-manifest.json');
    if (!existsSync(file))
        return null;
    const raw = JSON.parse(readFileSync(file, 'utf8'));
    const manifest = raw;
    if (manifest.package !== '@platform/codegenkit' ||
        !manifest.files ||
        typeof manifest.files !== 'object' ||
        Array.isArray(manifest.files) ||
        !allowIncompatible &&
            (manifest.schemaVersion !== 1 || manifest.toolApi !== 1 || manifest.harnessApi !== 1)) {
        throw new Error(`Unsupported Codegenkit install manifest API at ${file}; upgrade Codegenkit or remove the stale manifest explicitly.`);
    }
    for (const [relative, metadata] of Object.entries(manifest.files)) {
        if (path.isAbsolute(relative) ||
            relative.includes('\\') ||
            relative.split('/').some((part) => part === '' || part === '.' || part === '..') ||
            !metadata ||
            typeof metadata !== 'object' ||
            !/^[a-f0-9]{64}$/.test(metadata.sha256)) {
            throw new Error(`Invalid managed path in Codegenkit install manifest: ${relative}`);
        }
        managedPath(root, relative);
    }
    const gitignore = validateManifestGitignore(raw.gitignore);
    const mcp = validateManifestMcp(raw.mcp);
    return {
        ...manifest,
        ...(gitignore.length ? { gitignore } : {}),
        ...(mcp ? { mcp } : {}),
    };
}
function profiles(type) {
    return type === 'fullstack' ? ['fe', 'be'] : [type];
}
function targetPrefixesForAgents(targets) {
    const agentDirList = targets?.flatMap((target) => AGENT_DIRS[target] || []) || [];
    return agentDirList.length > 0 ? Array.from(new Set(agentDirList)) : ['.cursor'];
}
function managedSources(type, adapters, targets) {
    const selectedProfiles = profiles(type);
    const prefixes = targetPrefixesForAgents(targets);
    const sources = [];
    for (const targetPrefix of prefixes) {
        sources.push({
            root: path.join(packageRoot(), 'harness', 'shared'),
            targetPrefix,
        });
        for (const profile of selectedProfiles) {
            sources.push({
                root: path.join(packageRoot(), 'harness', profile),
                targetPrefix,
            });
        }
    }
    for (const adapter of [
        ...(selectedProfiles.includes('fe') &&
            (adapters.fe === 'dotnet-line' || adapters.fe === 'nextjs')
            ? [adapters.fe]
            : []),
        ...(selectedProfiles.includes('be') && adapters.be ? [adapters.be] : []),
    ]) {
        const registryRoot = path.join(packageRoot(), 'adapters', adapter, 'registries');
        if (existsSync(registryRoot)) {
            sources.push({
                root: registryRoot,
                targetPrefix: 'registries',
            });
        }
    }
    // Laravel PHP unitgen engine → product src/.codegenkit/ (gitignored, regenerated).
    if (selectedProfiles.includes('be') && adapters.be === 'laravel') {
        const phpRoot = path.join(packageRoot(), 'adapters', 'laravel', 'php');
        if (existsSync(phpRoot)) {
            sources.push({
                root: phpRoot,
                targetPrefix: 'src/.codegenkit',
            });
        }
    }
    return sources;
}
function currentTargets(manifest, targets) {
    const selectedTargets = new Set();
    for (const entry of managedSources(manifest.type, manifest.adapters, targets)) {
        for (const source of walk(entry.root)) {
            const rel = path.relative(entry.root, source);
            if (skipHarnessRel({
                type: manifest.type,
                adapters: manifest.adapters,
                rel,
            })) {
                continue;
            }
            selectedTargets.add(path.join(entry.targetPrefix, rel).split(path.sep).join('/'));
        }
    }
    return selectedTargets;
}
export function installHarness(opts) {
    const root = path.resolve(opts.projectRoot);
    const previous = readManifest(root);
    const adapters = {
        ...(opts.feAdapter ? { fe: opts.feAdapter } : {}),
        ...(opts.beAdapter ? { be: opts.beAdapter } : {}),
    };
    const result = {
        written: [],
        unchanged: [],
        conflicts: [],
        skipped: [],
        stale: [],
        gitignore: [],
    };
    const files = {};
    const sources = managedSources(opts.type, adapters, opts.targets);
    for (const entry of sources) {
        const sourceRoot = entry.root;
        for (const source of walk(sourceRoot)) {
            const rel = path.relative(sourceRoot, source);
            if (skipHarnessRel({ type: opts.type, adapters, rel }))
                continue;
            const targetRel = path.join(entry.targetPrefix, rel).split(path.sep).join('/');
            const target = managedPath(root, targetRel);
            const content = readFileSync(source, 'utf8');
            files[targetRel] = {
                source: path.relative(packageRoot(), source).split(path.sep).join('/'),
                sha256: hash(content),
            };
            if (existsSync(target)) {
                const current = readFileSync(target, 'utf8');
                if (current === content) {
                    result.unchanged.push(target);
                    continue;
                }
                // Shared config skills can overlap across toolkits; skip instead of conflict if already present
                if (targetRel.includes('configure-repo-maps') ||
                    targetRel.includes('legacy-platform') ||
                    targetRel.includes('configure-legacy-')) {
                    result.skipped.push(target);
                    continue;
                }
                const safe = previous?.files[targetRel]?.sha256 === hash(current);
                if (!opts.force && !safe) {
                    result.conflicts.push(target);
                    continue;
                }
            }
            mkdirSync(path.dirname(target), { recursive: true });
            writeFileSync(target, content);
            result.written.push(target);
        }
    }
    for (const [targetRel, metadata] of Object.entries(previous?.files ?? {})) {
        if (files[targetRel])
            continue;
        files[targetRel] = { ...metadata, stale: true };
        result.stale.push(managedPath(root, targetRel));
    }
    // Merge ignore entries into .gitignore. Claim all requested toolkit targets
    // (Docskit/Platform DNA shared-ownership contract): deinit only removes
    // exclusive entries, so claiming a shared pattern already present is safe.
    const requestedIgnore = opts.gitignoreEntries ?? [];
    const ensureResult = requestedIgnore.length
        ? ensureGitignoreEntries(root, requestedIgnore.map((entry) => entry.pattern))
        : { file: path.join(root, '.gitignore'), added: [], changed: false };
    if (ensureResult.changed)
        result.written.push(ensureResult.file);
    else if (requestedIgnore.length)
        result.unchanged.push(ensureResult.file);
    const gitignore = mergeOwnedGitignore(previous?.gitignore, requestedIgnore);
    result.gitignore = gitignore;
    const mcp = mergeManifestMcp(previous?.mcp, opts.mcp);
    mkdirSync(path.dirname(manifestFile(root)), { recursive: true });
    const manifest = {
        schemaVersion: 1,
        package: '@platform/codegenkit',
        packageVersion: packageVersion(),
        type: opts.type,
        adapters,
        toolApi: 1,
        harnessApi: 1,
        files,
        ...(gitignore.length ? { gitignore } : {}),
        ...(mcp ? { mcp } : {}),
    };
    writeFileSync(manifestFile(root), `${JSON.stringify(manifest, null, 2)}\n`);
    recordInstall(root);
    // Inject package.json scripts
    const packageJsonPath = path.join(root, 'package.json');
    if (existsSync(packageJsonPath)) {
        try {
            const pkgContent = readFileSync(packageJsonPath, 'utf8');
            const pkg = JSON.parse(pkgContent);
            pkg.scripts = pkg.scripts || {};
            let changed = false;
            const injectScript = (name, command) => {
                if (!pkg.scripts[name]) {
                    pkg.scripts[name] = command;
                    changed = true;
                }
            };
            const isFe = opts.type === 'fe' || opts.type === 'fullstack';
            const isBe = opts.type === 'be' || opts.type === 'fullstack';
            if (isFe) {
                injectScript('codegen', `codegenkit gen${opts.feAdapter ? ` --adapter=${opts.feAdapter}` : ''}`);
                injectScript('codegen:dry', `codegenkit gen:dry${opts.feAdapter ? ` --adapter=${opts.feAdapter}` : ''}`);
                injectScript('codegen:unit', `codegenkit unit-gen${opts.feAdapter ? ` --adapter=${opts.feAdapter}` : ''}`);
                injectScript('codegen:unit:dry', `codegenkit unit-gen:dry${opts.feAdapter ? ` --adapter=${opts.feAdapter}` : ''}`);
                injectScript('codegen:css', `codegenkit gen-css${opts.feAdapter ? ` --adapter=${opts.feAdapter}` : ''}`);
                injectScript('codegen:css:dry', `codegenkit gen-css:dry${opts.feAdapter ? ` --adapter=${opts.feAdapter}` : ''}`);
                if (opts.feAdapter !== 'dotnet-line') {
                    injectScript('codegen:common', `codegenkit gen-common${opts.feAdapter ? ` --adapter=${opts.feAdapter}` : ''}`);
                    injectScript('codegen:common:dry', `codegenkit gen-common:dry${opts.feAdapter ? ` --adapter=${opts.feAdapter}` : ''}`);
                }
            }
            if (isBe) {
                injectScript('codegen:api', `codegenkit api-gen${opts.beAdapter ? ` --adapter=${opts.beAdapter}` : ''}`);
                injectScript('codegen:api:dry', `codegenkit api-gen:dry${opts.beAdapter ? ` --adapter=${opts.beAdapter}` : ''}`);
                injectScript('codegen:api:unit', `codegenkit api-unit-gen${opts.beAdapter ? ` --adapter=${opts.beAdapter}` : ''}`);
                injectScript('codegen:api:unit:dry', `codegenkit api-unit-gen:dry${opts.beAdapter ? ` --adapter=${opts.beAdapter}` : ''}`);
            }
            if (changed) {
                writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
                result.written.push(packageJsonPath);
            }
            else {
                result.unchanged.push(packageJsonPath);
            }
        }
        catch (err) {
            console.warn(`Failed to inject scripts into package.json: ${err}`);
        }
    }
    return result;
}
function mergeManifestMcp(previous, next) {
    const merged = { ...(previous ?? {}), ...(next ?? {}) };
    return Object.keys(merged).length ? merged : undefined;
}
export function harnessStatus(projectRoot) {
    const root = path.resolve(projectRoot ?? process.cwd());
    const currentPackageVersion = packageVersion();
    const previous = readManifest(root, true);
    const healthy = [];
    const missing = [];
    const modified = [];
    const stale = [];
    if (!previous) {
        return {
            projectRoot: root,
            packageVersion: currentPackageVersion,
            installed: false,
            packageVersionInstalled: null,
            type: null,
            adapters: null,
            toolApi: null,
            harnessApi: null,
            healthy,
            missing,
            modified,
            stale,
            warnings: legacyProductEngineRoots(root).map((dir) => `legacy product engine present: ${path.relative(root, dir) || dir} (run codegenkit prune --yes)`),
            gitignore: [],
            mcp: [],
            compat: 'warn',
        };
    }
    const compatibleApis = previous.schemaVersion === 1 && previous.toolApi === 1 && previous.harnessApi === 1;
    const selectedTargets = compatibleApis ? currentTargets(previous) : null;
    for (const [targetRel, metadata] of Object.entries(previous.files)) {
        const target = managedPath(root, targetRel);
        if (!existsSync(target)) {
            missing.push(target);
            continue;
        }
        const currentHash = hash(readFileSync(target));
        const isStale = selectedTargets
            ? !selectedTargets.has(targetRel)
            : metadata.stale === true;
        if (isStale && currentHash === metadata.sha256)
            stale.push(target);
        else if (currentHash === metadata.sha256)
            healthy.push(target);
        else
            modified.push(target);
    }
    const warnings = legacyProductEngineRoots(root).map((dir) => `legacy product engine present: ${path.relative(root, dir) || dir} (run codegenkit prune --yes)`);
    return {
        projectRoot: root,
        packageVersion: currentPackageVersion,
        installed: true,
        packageVersionInstalled: previous.packageVersion,
        type: previous.type,
        adapters: previous.adapters,
        toolApi: previous.toolApi,
        harnessApi: previous.harnessApi,
        healthy,
        missing,
        modified,
        stale,
        warnings,
        gitignore: gitignoreStatus(root, previous),
        mcp: mcpStatus(root, previous),
        compat: !compatibleApis
            ? 'fail'
            : previous.packageVersion === currentPackageVersion && warnings.length === 0
                ? 'ok'
                : 'warn',
    };
}
function gitignoreStatus(root, manifest) {
    const entries = manifest.gitignore ?? [];
    if (!entries.length)
        return [];
    const file = path.join(root, '.gitignore');
    const present = new Set();
    if (existsSync(file) && lstatSync(file).isFile()) {
        for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#'))
                present.add(canonicalGitignorePattern(trimmed));
        }
    }
    return entries.map((entry) => ({
        pattern: entry.pattern,
        shared: Boolean(entry.shared),
        status: present.has(canonicalGitignorePattern(entry.pattern)) ? 'present' : 'missing',
    }));
}
function mcpEntryCanonicalHash(entry) {
    const canonical = (value) => {
        if (Array.isArray(value))
            return `[${value.map(canonical).join(',')}]`;
        if (value && typeof value === 'object') {
            const entries = Object.entries(value)
                .filter(([, v]) => v !== undefined)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`);
            return `{${entries.join(',')}}`;
        }
        return JSON.stringify(value ?? null);
    };
    return createHash('sha256').update(canonical(entry)).digest('hex');
}
function mcpStatus(root, manifest) {
    const mcp = manifest.mcp ?? {};
    const out = [];
    for (const [agent, ownership] of Object.entries(mcp)) {
        const file = managedPath(root, ownership.file);
        if (!existsSync(file)) {
            out.push({ agent, file: ownership.file, status: 'missing' });
            continue;
        }
        const lower = ownership.file.toLowerCase();
        const isJsonMcp = lower.endsWith('.json')
            || lower.endsWith('mcp.json')
            || lower.endsWith('settings.json')
            || lower.endsWith('mcp_config.json');
        if (!isJsonMcp) {
            out.push({ agent, file: ownership.file, status: 'present' });
            continue;
        }
        try {
            const doc = JSON.parse(readFileSync(file, 'utf8'));
            const entry = doc.mcpServers?.codegenkit;
            if (entry === undefined) {
                out.push({ agent, file: ownership.file, status: 'missing' });
            }
            else if (mcpEntryCanonicalHash(entry) === ownership.sha256) {
                out.push({ agent, file: ownership.file, status: 'present' });
            }
            else {
                out.push({ agent, file: ownership.file, status: 'modified' });
            }
        }
        catch {
            out.push({ agent, file: ownership.file, status: 'modified' });
        }
    }
    return out;
}
export function pruneHarness(opts = {}) {
    const root = path.resolve(opts.projectRoot ?? process.cwd());
    const previous = readManifest(root);
    const result = { removable: [], modified: [], removed: [] };
    for (const legacy of legacyProductEngineRoots(root)) {
        result.removable.push(legacy);
        if (opts.yes) {
            rmSync(legacy, { recursive: true, force: true });
            result.removed.push(legacy);
        }
    }
    if (!previous)
        return result;
    const selectedTargets = currentTargets(previous);
    for (const [targetRel, metadata] of Object.entries(previous.files)) {
        if (selectedTargets.has(targetRel))
            continue;
        const target = managedPath(root, targetRel);
        if (!existsSync(target))
            continue;
        if (hash(readFileSync(target)) !== metadata.sha256) {
            result.modified.push(target);
            continue;
        }
        result.removable.push(target);
        if (opts.yes) {
            rmSync(target);
            result.removed.push(target);
        }
    }
    if (opts.yes && result.removed.length && previous) {
        for (const target of result.removed) {
            const targetRel = path.relative(root, target).split(path.sep).join('/');
            delete previous.files[targetRel];
        }
        writeFileSync(manifestFile(root), `${JSON.stringify(previous, null, 2)}\n`);
    }
    return result;
}
function pruneEmptyDirs(root, files) {
    const directories = new Set();
    for (const file of files) {
        let directory = path.dirname(file);
        while (directory !== root && directory.startsWith(`${root}${path.sep}`)) {
            directories.add(directory);
            directory = path.dirname(directory);
        }
    }
    for (const directory of [...directories].sort((a, b) => b.length - a.length)) {
        try {
            if (existsSync(directory) && readdirSync(directory).length === 0) {
                rmSync(directory, { recursive: false });
            }
        }
        catch {
            // Keep non-empty or busy directories.
        }
    }
}
/**
 * Remove all manifest-owned harness assets, current and stale. Files whose
 * content no longer matches the recorded installed hash are preserved.
 * Exclusive gitignore entries are removed; shared entries are kept.
 */
export function uninstallHarness(opts = {}) {
    const root = path.resolve(opts.projectRoot ?? process.cwd());
    const manifest = readManifest(root);
    const dryRun = !opts.yes;
    const manifestPath = manifestFile(root);
    const result = {
        manifest: manifestPath,
        dryRun,
        removable: [],
        removed: [],
        modified: [],
        missing: [],
        manifestRemoved: false,
        gitignoreRemoved: [],
    };
    if (!manifest)
        return result;
    for (const [relative, metadata] of Object.entries(manifest.files)) {
        const target = managedPath(root, relative);
        if (!existsSync(target)) {
            result.missing.push(target);
            continue;
        }
        if (hash(readFileSync(target)) !== metadata.sha256) {
            result.modified.push(target);
            continue;
        }
        result.removable.push(target);
        if (opts.yes) {
            rmSync(target);
            result.removed.push(target);
        }
    }
    // Remove only exclusively-owned ignore entries; shared entries (for example
    // `.cursor/`) may still be relied on by another toolkit, so keep them.
    const exclusiveIgnore = (manifest.gitignore ?? [])
        .filter((entry) => !entry.shared)
        .map((entry) => entry.pattern);
    if (exclusiveIgnore.length) {
        if (dryRun) {
            const file = path.join(root, '.gitignore');
            const present = existsSync(file) && lstatSync(file).isFile()
                ? new Set(readFileSync(file, 'utf8')
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter((line) => line && !line.startsWith('#'))
                    .map(canonicalGitignorePattern))
                : new Set();
            for (const pattern of exclusiveIgnore) {
                if (present.has(canonicalGitignorePattern(pattern))) {
                    result.gitignoreRemoved.push(pattern);
                }
            }
        }
        else {
            const removed = removeGitignoreEntries(root, exclusiveIgnore);
            result.gitignoreRemoved.push(...removed.removed);
        }
    }
    if (!dryRun && existsSync(manifestPath)) {
        rmSync(manifestPath);
        result.manifestRemoved = true;
        forgetInstall(root);
        pruneEmptyDirs(root, [...result.removed, manifestPath, ...(opts.mcpRemovedPaths ?? [])]);
    }
    return result;
}
//# sourceMappingURL=harness.js.map