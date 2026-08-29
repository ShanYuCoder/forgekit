import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmdirSync, statSync, unlinkSync, writeFileSync, rmSync, copyFileSync, } from 'node:fs';
import path from 'node:path';
import { packageRoot } from '../config/docs-root.js';
import { canonicalGitignorePattern, mergeOwnedGitignore, removeGitignoreEntries, } from './gitignore.js';
import { forgetInstall, recordInstall } from './ledger.js';
import { AGENT_DIRS } from './agents.js';
import { profilesForTargets, renderHarnessTemplate, } from './agent-profile.js';
export const INSTALL_MANIFEST_PATH = '.docskit/install-manifest.json';
export const INSTALL_MANIFEST_SCHEMA = 1;
/** Skills installed on docs hubs (docs type). */
export const DOCSKIT_OWNED_SKILLS_DOCS = [
    'docskit',
    'overview',
    'architecture',
    'surfaces',
    'module',
    'deployment',
    'decision',
    'cross-cutting',
    'business-process',
    'spec',
    'update-spec',
    'qa-resolve',
    'grill',
    'grill-docs',
    'grill-bqa',
    'grill-dev',
    'db-erd',
    'cross-service',
    'architecture-grill',
    'build-templates',
    'openapi',
];
/** Skills installed on BE repos (be type). */
export const DOCSKIT_OWNED_SKILLS_BE = [
    'api',
    'api-spec',
    'api-update',
    'api-integration',
    'grill-api',
    'grill-api-spec',
    'grill-integration-spec',
    'call-external',
    'cross-entity-service',
];
/** @deprecated Use DOCSKIT_OWNED_SKILLS_DOCS or DOCSKIT_OWNED_SKILLS_BE */
export const DOCSKIT_OWNED_SKILLS = DOCSKIT_OWNED_SKILLS_DOCS;
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
function copyDir(src, dest, overwrite = false) {
    if (!existsSync(dest))
        mkdirSync(dest, { recursive: true });
    for (const name of readdirSync(src)) {
        const srcPath = path.join(src, name);
        const destPath = path.join(dest, name);
        if (statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath, overwrite);
        }
        else if (overwrite || !existsSync(destPath)) {
            writeFileSync(destPath, readFileSync(srcPath));
        }
    }
}
function packageMetadata() {
    const root = packageRoot();
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    const mcp = JSON.parse(readFileSync(path.join(root, 'mcp-package.json'), 'utf8'));
    if (typeof pkg.name !== 'string' ||
        typeof pkg.version !== 'string' ||
        mcp.package !== pkg.name ||
        mcp.version !== pkg.version ||
        !Number.isInteger(mcp.compatibility?.toolApi) ||
        !Number.isInteger(mcp.compatibility?.harnessApi)) {
        throw new Error('Docskit package metadata is inconsistent; reinstall a valid package');
    }
    return {
        package: pkg.name,
        version: pkg.version,
        toolApi: mcp.compatibility.toolApi,
        harnessApi: mcp.compatibility.harnessApi,
    };
}
function sha256(content) {
    return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}
function isWithin(root, candidate) {
    return candidate === root || candidate.startsWith(`${root}${path.sep}`);
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
function resolveProjectRoot(projectRoot) {
    const root = path.resolve(projectRoot ?? process.cwd());
    if (!existsSync(root) || !statSync(root).isDirectory()) {
        throw new Error(`Project root is not a directory: ${root}`);
    }
    return { root, realRoot: realpathSync(root) };
}
function resolveContainedPath(root, realRoot, rel, label) {
    if (typeof rel !== 'string' ||
        rel.length === 0 ||
        path.isAbsolute(rel) ||
        rel.includes('\\') ||
        rel.split('/').some((part) => part === '' || part === '.' || part === '..')) {
        throw new Error(`Invalid ${label} path: ${String(rel)}`);
    }
    const target = path.resolve(root, ...rel.split('/'));
    if (!isWithin(root, target)) {
        throw new Error(`${label} path escapes project root: ${rel}`);
    }
    let existing = target;
    while (!lexists(existing))
        existing = path.dirname(existing);
    let realExisting;
    try {
        realExisting = realpathSync(existing);
    }
    catch {
        throw new Error(`${label} path uses an invalid symlink: ${rel}`);
    }
    if (!isWithin(realRoot, realExisting)) {
        throw new Error(`${label} path escapes project root through a symlink: ${rel}`);
    }
    return target;
}
export function resolveManagedPath(root, realRoot, rel) {
    const allowedDirs = Object.values(AGENT_DIRS).flat();
    if (!allowedDirs.some(dir => rel.startsWith(`${dir}/`))) {
        throw new Error(`Invalid managed harness path in manifest: ${String(rel)}`);
    }
    return resolveContainedPath(root, realRoot, rel, 'Managed harness');
}
function manifestPath(root) {
    return path.join(root, ...INSTALL_MANIFEST_PATH.split('/'));
}
function validateHash(value, rel) {
    if (typeof value !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(value)) {
        throw new Error(`Invalid hash for managed harness path: ${rel}`);
    }
}
function validateManifestGitignore(value) {
    if (value === undefined)
        return [];
    if (!Array.isArray(value)) {
        throw new Error('Invalid Docskit install manifest gitignore');
    }
    const seen = new Set();
    const entries = [];
    for (const raw of value) {
        if (!raw ||
            typeof raw !== 'object' ||
            typeof raw.pattern !== 'string' ||
            !raw.pattern.trim() ||
            /[\r\n]/.test(raw.pattern)) {
            throw new Error('Invalid Docskit install manifest gitignore entry');
        }
        if (raw.shared !== undefined &&
            typeof raw.shared !== 'boolean') {
            throw new Error('Invalid Docskit install manifest gitignore shared flag');
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
function readManifest(root, realRoot, metadata) {
    const file = resolveContainedPath(root, realRoot, INSTALL_MANIFEST_PATH, 'Docskit install manifest');
    if (!existsSync(file))
        return undefined;
    const raw = JSON.parse(readFileSync(file, 'utf8'));
    if (raw.package !== metadata.package ||
        raw.schema !== INSTALL_MANIFEST_SCHEMA ||
        raw.toolApi !== metadata.toolApi ||
        raw.harnessApi !== metadata.harnessApi) {
        throw new Error(`Incompatible Docskit install manifest at ${file}; run a compatible Docskit version or move the manifest aside and reinstall`);
    }
    if (typeof raw.version !== 'string' ||
        !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(raw.version) ||
        !raw.hashes ||
        typeof raw.hashes !== 'object' ||
        Array.isArray(raw.hashes) ||
        (raw.stale !== undefined && (typeof raw.stale !== 'object' || Array.isArray(raw.stale)))) {
        throw new Error(`Invalid Docskit install manifest at ${file}`);
    }
    const hashes = {};
    for (const [rel, hash] of Object.entries(raw.hashes)) {
        resolveManagedPath(root, realRoot, rel);
        validateHash(hash, rel);
        hashes[rel] = hash;
    }
    const stale = {};
    for (const [rel, value] of Object.entries(raw.stale ?? {})) {
        resolveManagedPath(root, realRoot, rel);
        if (!value ||
            typeof value !== 'object' ||
            typeof value.sinceVersion !== 'string') {
            throw new Error(`Invalid stale metadata for managed harness path: ${rel}`);
        }
        validateHash(value.hash, rel);
        stale[rel] = {
            hash: value.hash,
            sinceVersion: value.sinceVersion,
        };
    }
    for (const rel of Object.keys(hashes)) {
        if (stale[rel])
            throw new Error(`Harness path is both current and stale: ${rel}`);
    }
    const gitignore = validateManifestGitignore(raw.gitignore);
    return {
        package: raw.package,
        schema: raw.schema,
        toolApi: raw.toolApi,
        harnessApi: raw.harnessApi,
        version: raw.version,
        hashes,
        stale,
        ...(gitignore.length ? { gitignore } : {}),
    };
}
function writeManifest(root, realRoot, manifest) {
    const file = resolveContainedPath(root, realRoot, INSTALL_MANIFEST_PATH, 'Docskit install manifest');
    mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.tmp-${process.pid}`;
    writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    renameSync(temporary, file);
    return file;
}
const CONSUMER_ASSETS = new Set([
    path.join('skills', 'docskit', 'SKILL.md'),
    path.join('rules', 'docskit.mdc'),
    path.join('schemas', 'docskit', 'missing-optional-event.schema.json'),
    path.join('extracts', 'docskit-phase-hooks.md'),
]);
/** Skills allowed for the 'be' harness type (prefix: skills/<name>/) */
const BE_SKILL_PREFIXES = new Set(DOCSKIT_OWNED_SKILLS_BE.map((s) => path.join('skills', s) + path.sep));
function isBeAsset(sourceRel) {
    // Always include non-skill assets (rules, schemas, extracts)
    if (!sourceRel.startsWith('skills' + path.sep))
        return true;
    return BE_SKILL_PREFIXES.has(sourceRel.slice(0, sourceRel.indexOf(path.sep, 'skills/'.length) + 1));
}
function harnessDirsForTargets(targets) {
    return [...new Set(profilesForTargets(targets).flatMap((p) => p.dirs))];
}
const TEXT_HARNESS_EXT = new Set([
    '.md',
    '.mdc',
    '.json',
    '.txt',
    '.yaml',
    '.yml',
    '.toml',
]);
function isTextHarnessFile(rel) {
    return TEXT_HARNESS_EXT.has(path.extname(rel).toLowerCase());
}
/**
 * Map a template-relative path to the destination path under one agent dir.
 * AGENTS.md may become CLAUDE.md / GEMINI.md / omitted (Cursor → mdc only).
 */
export function mapTemplateRelForAgent(sourceRelPosix, profile, agentDir) {
    if (sourceRelPosix === 'AGENTS.md') {
        if (!profile.overlayFile)
            return null;
        return `${agentDir}/${profile.overlayFile}`;
    }
    return [agentDir, ...sourceRelPosix.split('/')].join('/');
}
/** Build managed harness bytes per selected agent (generated, not copy/rename). */
export function currentAssetHashes(type, targets) {
    const sourceRoot = path.join(packageRoot(), 'harness', 'cursor');
    const assets = new Map();
    const profiles = profilesForTargets(targets);
    // One owner per agent dir (antigravity wins .gemini over bare gemini when both selected)
    const byDir = new Map();
    for (const profile of profiles) {
        for (const dir of profile.dirs) {
            const prev = byDir.get(dir);
            if (!prev || profile.id === 'antigravity') {
                byDir.set(dir, { ...profile, dirs: [dir] });
            }
        }
    }
    for (const source of walk(sourceRoot)) {
        const sourceRel = path.relative(sourceRoot, source);
        const sourceRelPosix = sourceRel.split(path.sep).join('/');
        if (sourceRelPosix === 'extracts/extract-registry.docskit.json')
            continue;
        if (type === 'consumer' && !CONSUMER_ASSETS.has(sourceRel))
            continue;
        if (type === 'be' && !isBeAsset(sourceRel))
            continue;
        const raw = readFileSync(source);
        for (const [agentDir, profile] of byDir) {
            const rel = mapTemplateRelForAgent(sourceRelPosix, profile, agentDir);
            if (!rel)
                continue;
            const content = isTextHarnessFile(sourceRelPosix)
                ? Buffer.from(renderHarnessTemplate(raw.toString('utf8'), profile, agentDir), 'utf8')
                : raw;
            assets.set(rel, { content, hash: sha256(content) });
        }
    }
    return assets;
}
function mergeExtractRegistry(projectRoot, realRoot, type, targets) {
    const source = path.join(packageRoot(), 'harness', 'cursor', 'extracts', 'extract-registry.docskit.json');
    const dirs = harnessDirsForTargets(targets);
    const results = [];
    const owned = JSON.parse(readFileSync(source, 'utf8'));
    const bundles = type === 'consumer'
        ? { docskit: owned.bundles.docskit }
        : owned.bundles;
    for (const dir of dirs) {
        const target = resolveContainedPath(projectRoot, realRoot, `${dir}/extracts/extract-registry.json`, 'Shared extract registry');
        const current = existsSync(target)
            ? JSON.parse(readFileSync(target, 'utf8'))
            : { version: 1, bundles: {} };
        current.version = Math.max(current.version ?? 1, owned.version ?? 1);
        if (type === 'consumer')
            delete current.bundles['architecture-core'];
        // Registry source paths are authored as `.cursor/...`; rewrite to the
        // install agent dir (e.g. `.agents/...` for Antigravity).
        const localized = {};
        for (const [name, paths] of Object.entries(bundles)) {
            localized[name] = paths.map((p) => p.startsWith('.cursor/') ? `${dir}/${p.slice('.cursor/'.length)}` : p);
        }
        current.bundles = {
            ...current.bundles,
            ...localized,
        };
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
        results.push(target);
    }
    return results;
}
/** Hub-root `qa/open/` inbox. Does not overwrite member QA files. */
export function scaffoldQaInbox(root) {
    const sourceRoot = path.join(packageRoot(), 'templates', 'hub-qa');
    if (!existsSync(sourceRoot))
        return;
    copyDir(sourceRoot, path.join(root, 'qa'), false);
}
export function scaffoldProductSkeleton(root) {
    const sourceRoot = path.join(packageRoot(), 'templates', 'product-skeleton');
    if (!existsSync(sourceRoot))
        return;
    // Clean up templates/product-skeleton/components if still present on disk
    const templateComponentsDir = path.join(sourceRoot, 'components');
    if (existsSync(templateComponentsDir)) {
        try {
            rmSync(templateComponentsDir, { recursive: true, force: true });
        }
        catch { }
    }
    const destRoot = path.join(root, 'product');
    if (!existsSync(destRoot))
        mkdirSync(destRoot, { recursive: true });
    copyDir(sourceRoot, destRoot);
    // Also clean up components in the destination
    const destComponentsDir = path.join(destRoot, 'components');
    if (existsSync(destComponentsDir)) {
        try {
            rmSync(destComponentsDir, { recursive: true, force: true });
        }
        catch { }
    }
}
export function scaffoldSchemas(root) {
    const sourceRoot = path.join(packageRoot(), 'templates', 'schemas');
    if (!existsSync(sourceRoot))
        return;
    const destRoot = path.join(root, 'schemas');
    if (!existsSync(destRoot))
        mkdirSync(destRoot, { recursive: true });
    copyDir(sourceRoot, destRoot);
}
/** Ensure `.harness/` exists for tracking. */
export function scaffoldHarnessState(root) {
    const harnessDir = path.join(root, '.harness');
    mkdirSync(harnessDir, { recursive: true });
    const readme = path.join(root, '.harness', 'README.md');
    if (!existsSync(readme)) {
        writeFileSync(readme, [
            '# Harness state',
            '',
            'SSOT for agent run tracking (all hosts).',
            '',
            '- `TODO.md` (in project root) — live TODO from skill Workflow and detailed plan',
            '- `progress.md` — session handoff (optional)',
            '- `feature_list.json` — scope list (optional)',
            '',
            'Host overlays (Antigravity `AGENTS.md`, Cursor rules) point here;',
            'do not create task trackers under `.agents/tasks/` or `.harness/tasks/`.',
            '',
        ].join('\n'), 'utf8');
    }
}
/**
 * Inject backend API scripts and devDependencies into the consuming repo's package.json.
 * Called when installHarness is run with type === 'be'.
 */
export function injectBackendScripts(root) {
    const pkgPath = path.join(root, 'package.json');
    if (!existsSync(pkgPath))
        return;
    try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        let changed = false;
        if (!pkg.scripts)
            pkg.scripts = {};
        if (!pkg.devDependencies)
            pkg.devDependencies = {};
        const pkgName = '@platform/docskit';
        const scriptsToInject = {
            'openapi:gen': `docskit openapi:gen`,
            'openapi:render': `docskit openapi:render`,
            'openapi:bundle': 'pnpm openapi:render && REDOCLY_TELEMETRY=off pnpm exec redocly bundle docs/openapi/api.yaml -o docs/public/openapi/openapi.yaml',
            'openapi:build': `docskit openapi:build`,
            'openapi:dev': 'pnpm openapi:bundle && pnpm openapi:build && npx -y serve docs/public -l 4174 --no-clipboard',
        };
        for (const [name, cmd] of Object.entries(scriptsToInject)) {
            if (!pkg.scripts[name]) {
                pkg.scripts[name] = cmd;
                changed = true;
            }
        }
        const depsToInject = {
            '@redocly/cli': '^2.34.0',
            'swagger-ui-dist': '^5.32.6',
            'yaml': '^2.9.0',
        };
        for (const [dep, version] of Object.entries(depsToInject)) {
            if (!pkg.devDependencies[dep]) {
                pkg.devDependencies[dep] = version;
                changed = true;
            }
        }
        if (changed) {
            writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        }
    }
    catch {
        // Ignore invalid package.json
    }
}
function injectVitepressScripts(root) {
    const pkgPath = path.join(root, 'package.json');
    if (!existsSync(pkgPath)) {
        writeFileSync(pkgPath, `${JSON.stringify({ name: 'docs-hub', private: true, scripts: {} }, null, 2)}\n`);
    }
    try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        let changed = false;
        if (!pkg.scripts)
            pkg.scripts = {};
        if (pkg.scripts['docs:build'] !== 'pnpm docs:render && vitepress build') {
            pkg.scripts['docs:build'] = 'pnpm docs:render && vitepress build';
            changed = true;
        }
        if (pkg.scripts['docs:dev'] !== 'vitepress dev') {
            pkg.scripts['docs:dev'] = 'vitepress dev';
            changed = true;
        }
        if (pkg.scripts['docs:preview'] !== 'vitepress preview') {
            pkg.scripts['docs:preview'] = 'vitepress preview';
            changed = true;
        }
        if (pkg.scripts['docs:render'] !== 'docskit render') {
            pkg.scripts['docs:render'] = 'docskit render';
            changed = true;
        }
        if (pkg.scripts['docs:publish'] !== 'docskit publish') {
            pkg.scripts['docs:publish'] = 'docskit publish';
            changed = true;
        }
        if (pkg.scripts['docs:render-common'] !== 'docskit render-common') {
            pkg.scripts['docs:render-common'] = 'docskit render-common';
            changed = true;
        }
        if (pkg.scripts['docs:split'] !== 'docskit split') {
            pkg.scripts['docs:split'] = 'docskit split';
            changed = true;
        }
        if (pkg.scripts['docs:split-all'] !== 'docskit split-all') {
            pkg.scripts['docs:split-all'] = 'docskit split-all';
            changed = true;
        }
        if (pkg.scripts['docs:check'] !== 'docskit split --check') {
            pkg.scripts['docs:check'] = 'docskit split --check';
            changed = true;
        }
        if (!pkg.devDependencies)
            pkg.devDependencies = {};
        const requiredDeps = {
            '@braintree/sanitize-url': '^7.1.2',
            'cytoscape': '^3.34.0',
            'cytoscape-cose-bilkent': '^4.1.0',
            'dayjs': '^1.11.21',
            'debug': '^4.4.3',
            'mermaid': '^11.16.0',
            'vitepress': 'latest',
            'vitepress-mermaid-renderer': '^1.1.28',
            'vitepress-plugin-mermaid': '^2.0.17'
        };
        for (const [dep, version] of Object.entries(requiredDeps)) {
            if (!pkg.devDependencies[dep]) {
                pkg.devDependencies[dep] = version;
                changed = true;
            }
        }
        if (changed) {
            writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        }
    }
    catch {
        // Ignore invalid package.json
    }
    const vitepressDir = path.join(root, '.vitepress');
    if (!existsSync(vitepressDir))
        mkdirSync(vitepressDir, { recursive: true });
    const sourceVitepressDir = path.join(packageRoot(), 'engines', 'docs', 'vitepress');
    copyDir(sourceVitepressDir, vitepressDir, true);
    const vitepressGitignorePath = path.join(vitepressDir, '.gitignore');
    writeFileSync(vitepressGitignorePath, 'cache\ndist\n');
}
function syncDocskitTemplates(root) {
    const templatesDir = path.join(root, '.docskit', 'templates');
    if (!existsSync(templatesDir))
        mkdirSync(templatesDir, { recursive: true });
    // Copy EJS templates
    const sourceEjsDir = path.join(packageRoot(), 'templates', 'shared', 'templates');
    if (existsSync(sourceEjsDir)) {
        copyDir(sourceEjsDir, templatesDir, false);
    }
    // Copy YAML templates and documentation
    const sourceSharedDir = path.join(packageRoot(), 'templates', 'shared');
    if (existsSync(sourceSharedDir)) {
        const entries = readdirSync(sourceSharedDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === 'templates')
                continue;
            const srcPath = path.join(sourceSharedDir, entry.name);
            const destPath = path.join(templatesDir, entry.name);
            if (entry.isDirectory()) {
                copyDir(srcPath, destPath, false);
            }
            else if (entry.isFile() && !existsSync(destPath)) {
                copyFileSync(srcPath, destPath);
            }
        }
    }
}
/**
 * Sync Docskit-owned Cursor harness assets into a docs hub.
 * Skips package-local registry source files and preserves customized targets.
 */
export function installHarness(opts = {}) {
    const { root, realRoot } = resolveProjectRoot(opts.projectRoot);
    const type = opts.type ?? 'docs';
    const metadata = packageMetadata();
    const previous = readManifest(root, realRoot, metadata);
    const assets = currentAssetHashes(type, opts.targets);
    resolveContainedPath(root, realRoot, INSTALL_MANIFEST_PATH, 'Docskit install manifest');
    const dirs = harnessDirsForTargets(opts.targets);
    for (const dir of dirs) {
        resolveContainedPath(root, realRoot, `${dir}/extracts/extract-registry.json`, 'Shared extract registry');
    }
    for (const rel of assets.keys())
        resolveManagedPath(root, realRoot, rel);
    const hashes = Object.fromEntries([...assets].map(([rel, asset]) => [rel, asset.hash]));
    const stale = { ...(previous?.stale ?? {}) };
    for (const [rel, hash] of Object.entries(previous?.hashes ?? {})) {
        if (!assets.has(rel) && !stale[rel]) {
            stale[rel] = { hash, sinceVersion: metadata.version };
        }
    }
    for (const rel of assets.keys())
        delete stale[rel];
    const result = {
        written: [],
        unchanged: [],
        skipped: [],
        stale: Object.keys(stale).map((rel) => resolveManagedPath(root, realRoot, rel)),
        manifest: manifestPath(root),
    };
    for (const [rel, asset] of assets) {
        const target = resolveManagedPath(root, realRoot, rel);
        const content = asset.content;
        if (existsSync(target)) {
            const currentHash = sha256(readFileSync(target));
            if (currentHash === asset.hash) {
                result.unchanged.push(target);
                continue;
            }
            const previousHash = previous?.hashes[rel];
            const locallyModified = previousHash === undefined || currentHash !== previousHash;
            if (locallyModified && !opts.force) {
                result.skipped.push(target);
                continue;
            }
        }
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, content);
        result.written.push(target);
    }
    const gitignore = mergeOwnedGitignore(previous?.gitignore, opts.gitignoreEntries);
    const nextManifest = {
        package: metadata.package,
        schema: INSTALL_MANIFEST_SCHEMA,
        toolApi: metadata.toolApi,
        harnessApi: metadata.harnessApi,
        version: metadata.version,
        hashes,
        stale,
        ...(gitignore.length ? { gitignore } : {}),
    };
    result.manifest = writeManifest(root, realRoot, nextManifest);
    result.registry = mergeExtractRegistry(root, realRoot, type, opts.targets);
    if (type === 'docs') {
        scaffoldProductSkeleton(root);
        scaffoldQaInbox(root);
        scaffoldSchemas(root);
        scaffoldHarnessState(root);
        injectVitepressScripts(root);
        injectBackendScripts(root);
        syncDocskitTemplates(root);
    }
    if (type === 'be') {
        injectBackendScripts(root);
    }
    if (opts.defaultLanguage) {
        const configPath = path.join(root, '.docskit', 'config.json');
        mkdirSync(path.dirname(configPath), { recursive: true });
        let cfg = {};
        try {
            if (existsSync(configPath)) {
                cfg = JSON.parse(readFileSync(configPath, 'utf8'));
            }
        }
        catch { }
        cfg.defaultLanguage = opts.defaultLanguage;
        writeFileSync(configPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
    }
    recordInstall(root);
    return result;
}
/**
 * Update only managed gitignore metadata on an existing install (used when
 * init merges ignores after harness assets are already written).
 */
export function recordManagedGitignore(projectRoot, entries) {
    const { root, realRoot } = resolveProjectRoot(projectRoot);
    const metadata = packageMetadata();
    const manifest = readManifest(root, realRoot, metadata);
    if (!manifest) {
        throw new Error(`Docskit install manifest not found: ${manifestPath(root)}`);
    }
    const gitignore = mergeOwnedGitignore(manifest.gitignore, entries);
    const next = {
        ...manifest,
        ...(gitignore.length ? { gitignore } : {}),
    };
    if (!gitignore.length)
        delete next.gitignore;
    writeManifest(root, realRoot, next);
    return next;
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
export function statusHarness(opts = {}) {
    const { root, realRoot } = resolveProjectRoot(opts.projectRoot);
    const metadata = packageMetadata();
    const manifest = readManifest(root, realRoot, metadata);
    const result = {
        manifest: manifestPath(root),
        installed: manifest !== undefined,
        version: manifest?.version,
        current: [],
        modified: [],
        missing: [],
        stale: [],
        staleModified: [],
        staleMissing: [],
        gitignore: [],
    };
    if (!manifest)
        return result;
    for (const [rel, expectedHash] of Object.entries(manifest.hashes)) {
        const target = resolveManagedPath(root, realRoot, rel);
        if (!existsSync(target))
            result.missing.push(target);
        else if (sha256(readFileSync(target)) === expectedHash)
            result.current.push(target);
        else
            result.modified.push(target);
    }
    for (const [rel, asset] of Object.entries(manifest.stale)) {
        const target = resolveManagedPath(root, realRoot, rel);
        if (!existsSync(target))
            result.staleMissing.push(target);
        else if (sha256(readFileSync(target)) === asset.hash)
            result.stale.push(target);
        else
            result.staleModified.push(target);
    }
    result.gitignore = gitignoreStatus(root, manifest);
    return result;
}
export function pruneHarness(opts = {}) {
    const { root, realRoot } = resolveProjectRoot(opts.projectRoot);
    const metadata = packageMetadata();
    const manifest = readManifest(root, realRoot, metadata);
    const result = {
        manifest: manifestPath(root),
        dryRun: !opts.yes,
        deleted: [],
        wouldDelete: [],
        preservedModified: [],
        missing: [],
    };
    if (!manifest)
        return result;
    const retained = { ...manifest.stale };
    for (const [rel, asset] of Object.entries(manifest.stale)) {
        const target = resolveManagedPath(root, realRoot, rel);
        if (!existsSync(target)) {
            result.missing.push(target);
            if (opts.yes)
                delete retained[rel];
            continue;
        }
        if (sha256(readFileSync(target)) !== asset.hash) {
            result.preservedModified.push(target);
            continue;
        }
        if (!opts.yes) {
            result.wouldDelete.push(target);
            continue;
        }
        unlinkSync(target);
        result.deleted.push(target);
        delete retained[rel];
    }
    if (opts.yes && Object.keys(retained).length !== Object.keys(manifest.stale).length) {
        writeManifest(root, realRoot, { ...manifest, stale: retained });
    }
    return result;
}
function pruneEmptyDirs(root, files) {
    const dirs = new Set();
    for (const file of files) {
        let dir = path.dirname(file);
        while (isWithin(root, dir) && dir !== root) {
            dirs.add(dir);
            dir = path.dirname(dir);
        }
    }
    for (const dir of [...dirs].sort((a, b) => b.length - a.length)) {
        try {
            if (existsSync(dir) && readdirSync(dir).length === 0)
                rmdirSync(dir);
        }
        catch {
            /* leave non-empty or busy dirs */
        }
    }
}
/**
 * Remove the docskit-owned bundle keys from the shared extract registry.
 * Deletes the file only when no other toolkit's bundles remain.
 */
function uninstallExtractRegistry(projectRoot, realRoot, dryRun) {
    const source = path.join(packageRoot(), 'harness', 'cursor', 'extracts', 'extract-registry.docskit.json');
    const owned = JSON.parse(readFileSync(source, 'utf8'));
    const ownedKeys = Object.keys(owned.bundles ?? {});
    const results = [];
    const allDirs = Array.from(new Set(Object.values(AGENT_DIRS).flat()));
    for (const dir of allDirs) {
        const target = path.join(projectRoot, dir, 'extracts', 'extract-registry.json');
        if (!existsSync(target))
            continue;
        const current = JSON.parse(readFileSync(target, 'utf8'));
        const currentBundles = current.bundles ?? {};
        const present = ownedKeys.filter((key) => key in currentBundles);
        if (present.length === 0)
            continue;
        if (dryRun) {
            results.push(`${target} (would remove ${present.length} docskit bundle key(s))`);
            continue;
        }
        for (const key of present)
            delete currentBundles[key];
        current.bundles = currentBundles;
        if (Object.keys(currentBundles).length === 0) {
            unlinkSync(target);
            results.push(`${target} (removed; no bundles left)`);
            continue;
        }
        writeFileSync(target, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
        results.push(`${target} (removed ${present.length} docskit bundle key(s))`);
    }
    return results;
}
/**
 * Full removal: delete every docskit-owned harness file recorded in the manifest
 * (current + stale), preserve and report member-modified files, un-merge the
 * shared extract registry, remove exclusive ignore entries (keep shared), then
 * drop the manifest. Dry-run unless `yes`.
 */
export function uninstallHarness(opts = {}) {
    const { root, realRoot } = resolveProjectRoot(opts.projectRoot);
    const metadata = packageMetadata();
    const manifest = readManifest(root, realRoot, metadata);
    const dryRun = !opts.yes;
    const result = {
        manifest: manifestPath(root),
        dryRun,
        deleted: [],
        wouldDelete: [],
        preservedModified: [],
        missing: [],
        manifestRemoved: false,
    };
    if (!manifest)
        return result;
    const owned = [
        ...Object.entries(manifest.hashes),
        ...Object.entries(manifest.stale).map(([rel, asset]) => [rel, asset.hash]),
    ];
    for (const [rel, expectedHash] of owned) {
        const target = resolveManagedPath(root, realRoot, rel);
        if (!existsSync(target)) {
            result.missing.push(target);
            continue;
        }
        if (sha256(readFileSync(target)) !== expectedHash) {
            result.preservedModified.push(target);
            continue;
        }
        if (dryRun) {
            result.wouldDelete.push(target);
            continue;
        }
        unlinkSync(target);
        result.deleted.push(target);
    }
    const registries = uninstallExtractRegistry(root, realRoot, dryRun);
    for (const r of registries)
        result.registry = (result.registry ? result.registry + '\n' + r : r);
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
                    result.wouldDelete.push(`${file} entry: ${pattern}`);
                }
            }
        }
        else {
            const removed = removeGitignoreEntries(root, exclusiveIgnore);
            for (const pattern of removed.removed) {
                result.deleted.push(`${removed.file} entry: ${pattern}`);
            }
        }
    }
    const manifestFile = resolveContainedPath(root, realRoot, INSTALL_MANIFEST_PATH, 'Docskit install manifest');
    if (dryRun) {
        result.wouldDelete.push(manifestFile);
        return result;
    }
    if (existsSync(manifestFile)) {
        unlinkSync(manifestFile);
        result.manifestRemoved = true;
    }
    // Remove .docskit/templates/ — these are synced by syncDocskitTemplates
    // but not tracked in manifest hashes, so must be cleaned up explicitly.
    const docskitTemplatesDir = path.join(root, '.docskit', 'templates');
    if (existsSync(docskitTemplatesDir)) {
        for (const file of walk(docskitTemplatesDir)) {
            unlinkSync(file);
            result.deleted.push(file);
        }
    }
    // Remove injected scripts and devDependencies from package.json
    const pkgPath = path.join(root, 'package.json');
    if (existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
            let pkgChanged = false;
            const injectedScripts = [
                'docs:build', 'docs:dev', 'docs:preview', 'docs:render', 'docs:publish', 'docs:render-common',
                'docs:split', 'docs:split-all', 'docs:check',
                'openapi:gen', 'openapi:render', 'openapi:bundle', 'openapi:build', 'openapi:dev',
                'openapi:lint', 'swagger:build', 'swagger:dev', 'spec:split', 'spec:split:check'
            ];
            if (pkg.scripts) {
                for (const s of injectedScripts) {
                    if (s in pkg.scripts) {
                        delete pkg.scripts[s];
                        pkgChanged = true;
                    }
                }
            }
            if (pkgChanged) {
                writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
            }
        }
        catch {
            /* ignore invalid package.json */
        }
    }
    forgetInstall(root);
    pruneEmptyDirs(root, [...result.deleted.filter((p) => !p.includes(' entry: ')), manifestFile]);
    return result;
}
//# sourceMappingURL=harness.js.map