import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmdirSync, unlinkSync, writeFileSync, } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { packageRoot } from '../config/platform-repos.js';
import { CONFIG_NAME, defaultRepoConfig, loadRepoConfig, loadStackPreset, } from '../config/load-config.js';
import { forgetInstall, recordInstall } from './ledger.js';
import { applyGeneratedGitignore, canonicalGitignorePattern, gitignoreEntryStatus, mergeGitignoreEntries, removeGitignoreEntries, } from './gitignore.js';
import { AGENT_DIRS } from './agents.js';
const LANE_TYPES = ['docs', 'fe', 'be', 'test'];
export const INSTALL_MANIFEST_SCHEMA_VERSION = 1;
export const INSTALL_MANIFEST_PACKAGE = '@platform/artifactgraph';
export const INSTALL_MANIFEST_TOOL_API = 1;
export const INSTALL_MANIFEST_HARNESS_API = 1;
const LEGACY_MANIFEST_PACKAGE_VERSION = '2.0.0';
const COMMON_ASSETS = [
    [
        'harness/common/skills/artifactgraph/SKILL.md',
        '.cursor/skills/artifactgraph/SKILL.md',
    ],
    [
        'harness/common/skills/docs-mark/SKILL.md',
        '.cursor/skills/docs-mark/SKILL.md',
    ],
    [
        'harness/common/skills/platform-mark/SKILL.md',
        '.cursor/skills/platform-mark/SKILL.md',
    ],
    ['harness/common/rules/artifactgraph.mdc', '.cursor/rules/artifactgraph.mdc'],
    [
        'harness/common/rules/team-flow-harness-state.mdc',
        '.cursor/rules/team-flow-harness-state.mdc',
    ],
    [
        'harness/common/rules/platform-code-size.mdc',
        '.cursor/rules/platform-code-size.mdc',
    ],
    [
        'harness/common/extracts/artifactgraph-hooks-core.md',
        '.cursor/extracts/artifactgraph-hooks-core.md',
    ],
    [
        'harness/common/extracts/artifactgraph-phase-hooks.md',
        '.cursor/extracts/artifactgraph-phase-hooks.md',
    ],
    [
        'harness/common/extracts/core/agent-discipline.md',
        '.cursor/extracts/core/agent-discipline.md',
    ],
    [
        'harness/common/extracts/artifact-graph.md',
        '.cursor/extracts/artifact-graph.md',
    ],
    [
        'harness/common/extracts/extract-registry.json',
        '.cursor/extracts/extract-registry.json',
    ],
    [
        'harness/common/extracts/docs-mark.md',
        '.cursor/extracts/docs-mark.md',
    ],
    [
        'harness/common/extracts/docs-mark-detect.md',
        '.cursor/extracts/docs-mark-detect.md',
    ],
    ['lexicon/registry-tags.en.txt', 'artifactgraph/lexicon/registry-tags.en.txt'],
];
const TYPE_ASSETS = {
    docs: [
        [
            'harness/docs/extracts/artifactgraph-hooks-docs.md',
            '.cursor/extracts/artifactgraph-hooks-docs.md',
        ],
        [
            'harness/docs/extracts/artifactgraph-parity.md',
            '.cursor/extracts/artifactgraph-parity.md',
        ],
    ],
    fe: [
        [
            'harness/fe/extracts/artifactgraph-hooks-fe.md',
            '.cursor/extracts/artifactgraph-hooks-fe.md',
        ],
    ],
    be: [
        [
            'harness/be/extracts/artifactgraph-hooks-be.md',
            '.cursor/extracts/artifactgraph-hooks-be.md',
        ],
    ],
    test: [
        [
            'harness/test/extracts/artifactgraph-hooks-test.md',
            '.cursor/extracts/artifactgraph-hooks-test.md',
        ],
        ['lexicon/testcase-taxonomy.en.txt', 'artifactgraph/lexicon/testcase-taxonomy.en.txt'],
    ],
};
function sha256(content) {
    return createHash('sha256').update(content).digest('hex');
}
function writeAtomic(file, content) {
    mkdirSync(path.dirname(file), { recursive: true });
    const temp = `${file}.artifactgraph-tmp-${process.pid}`;
    writeFileSync(temp, content, 'utf8');
    renameSync(temp, file);
}
function packageVersion() {
    const pkg = JSON.parse(readFileSync(path.join(packageRoot(), 'package.json'), 'utf8'));
    return pkg.version ?? '0.0.0';
}
export function normalizeInstallTypes(types) {
    const requested = new Set(types.length ? types : ['common']);
    if (requested.has('all')) {
        return ['common', ...LANE_TYPES];
    }
    requested.add('common');
    return ['common', ...LANE_TYPES.filter((type) => requested.has(type))];
}
export function parseInstallTypes(raw) {
    if (!raw)
        return [];
    const known = new Set(['common', 'docs', 'fe', 'be', 'test', 'all']);
    const parsed = raw
        .split(',')
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean);
    for (const type of parsed) {
        if (!known.has(type)) {
            throw new Error(`Unknown init type "${type}". Known: common, docs, fe, be, test, all`);
        }
    }
    return normalizeInstallTypes(parsed);
}
function isRecord(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function isInstallType(value) {
    return ['common', 'docs', 'fe', 'be', 'test', 'all'].includes(String(value));
}
function hasValidManifestPayload(value) {
    if (typeof value.packageVersion !== 'string' ||
        !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value.packageVersion) ||
        !Array.isArray(value.types) ||
        !value.types.every(isInstallType) ||
        !isRecord(value.files)) {
        return false;
    }
    if (value.gitignore !== undefined) {
        if (!Array.isArray(value.gitignore))
            return false;
        for (const entry of value.gitignore) {
            if (!isRecord(entry) ||
                typeof entry.pattern !== 'string' ||
                !entry.pattern ||
                /[\r\n]/.test(entry.pattern) ||
                (entry.shared !== undefined && typeof entry.shared !== 'boolean')) {
                return false;
            }
        }
    }
    return Object.values(value.files).every((file) => isManagedFile(file) &&
        (!('stale' in file) || file.stale === undefined || typeof file.stale === 'boolean'));
}
function normalizeManifestGitignore(value) {
    if (!Array.isArray(value.gitignore))
        return undefined;
    const seen = new Set();
    const entries = [];
    for (const raw of value.gitignore) {
        if (!isRecord(raw) || typeof raw.pattern !== 'string')
            continue;
        const pattern = raw.pattern.trim();
        const key = canonicalGitignorePattern(pattern);
        if (!key || seen.has(key))
            continue;
        seen.add(key);
        entries.push({
            pattern,
            ...(raw.shared === true ? { shared: true } : {}),
        });
    }
    return entries.length ? entries : undefined;
}
function recoveryGuidance(manifestPath) {
    return `Upgrade ArtifactGraph to a compatible version, or back up and remove ${manifestPath}, then run artifactgraph init to re-initialize it.`;
}
function inspectManifest(file) {
    if (!existsSync(file)) {
        return {
            exists: false,
            compatibility: 'not-installed',
            manifest: null,
            raw: null,
            warnings: [],
        };
    }
    let parsed;
    try {
        parsed = JSON.parse(readFileSync(file, 'utf8'));
    }
    catch {
        return {
            exists: true,
            compatibility: 'incompatible',
            manifest: null,
            raw: null,
            warnings: [],
            error: `ArtifactGraph install manifest is not valid JSON. ${recoveryGuidance(file)}`,
        };
    }
    if (!isRecord(parsed)) {
        return {
            exists: true,
            compatibility: 'incompatible',
            manifest: null,
            raw: null,
            warnings: [],
            error: `ArtifactGraph install manifest must be a JSON object. ${recoveryGuidance(file)}`,
        };
    }
    const fail = (reason) => ({
        exists: true,
        compatibility: 'incompatible',
        manifest: null,
        raw: parsed,
        warnings: [],
        error: `${reason} ${recoveryGuidance(file)}`,
    });
    const hasContractFields = ['schemaVersion', 'package', 'toolApi', 'harnessApi'].some((key) => key in parsed);
    if (hasContractFields) {
        if (parsed.schemaVersion !== INSTALL_MANIFEST_SCHEMA_VERSION) {
            return fail(`Unsupported install-manifest schemaVersion ${String(parsed.schemaVersion)}; this ArtifactGraph supports schemaVersion ${INSTALL_MANIFEST_SCHEMA_VERSION}.`);
        }
        if (parsed.package !== INSTALL_MANIFEST_PACKAGE) {
            return fail(`Install manifest belongs to ${String(parsed.package)}, not ${INSTALL_MANIFEST_PACKAGE}.`);
        }
        if (parsed.toolApi !== INSTALL_MANIFEST_TOOL_API) {
            return fail(`Unsupported install-manifest toolApi ${String(parsed.toolApi)}; this ArtifactGraph supports toolApi ${INSTALL_MANIFEST_TOOL_API}.`);
        }
        if (parsed.harnessApi !== INSTALL_MANIFEST_HARNESS_API) {
            return fail(`Unsupported install-manifest harnessApi ${String(parsed.harnessApi)}; this ArtifactGraph supports harnessApi ${INSTALL_MANIFEST_HARNESS_API}.`);
        }
        if (!hasValidManifestPayload(parsed)) {
            return fail('Install manifest has an invalid packageVersion, types, or files payload.');
        }
        const gitignore = normalizeManifestGitignore(parsed);
        return {
            exists: true,
            compatibility: 'supported',
            manifest: {
                ...parsed,
                ...(gitignore ? { gitignore } : {}),
            },
            raw: parsed,
            warnings: [],
        };
    }
    if (parsed.version === 1 &&
        parsed.packageVersion === LEGACY_MANIFEST_PACKAGE_VERSION &&
        hasValidManifestPayload(parsed)) {
        return {
            exists: true,
            compatibility: 'legacy',
            manifest: parsed,
            raw: parsed,
            warnings: [
                `Legacy ArtifactGraph ${LEGACY_MANIFEST_PACKAGE_VERSION} install manifest; run artifactgraph init to migrate it to the package contract.`,
            ],
        };
    }
    return fail(`Unsupported legacy install manifest; only ArtifactGraph ${LEGACY_MANIFEST_PACKAGE_VERSION} version:1 manifests can be migrated safely.`);
}
export function assertProjectManifestCompatible(repoRoot) {
    const manifestPath = path.join(path.resolve(repoRoot), '.artifactgraph', 'install-manifest.json');
    const inspection = inspectManifest(manifestPath);
    if (inspection.compatibility === 'incompatible') {
        throw new Error(inspection.error);
    }
    return inspection.manifest;
}
export function projectInstallStatus(repoRoot) {
    const root = path.resolve(repoRoot);
    const manifestPath = path.join(root, '.artifactgraph', 'install-manifest.json');
    const inspection = inspectManifest(manifestPath);
    const manifest = inspection.manifest;
    const raw = inspection.raw;
    const status = {
        installed: inspection.exists,
        manifestPath,
        compatibility: inspection.compatibility,
        compatible: inspection.compatibility !== 'incompatible',
        legacy: inspection.compatibility === 'legacy',
        warnings: inspection.warnings,
        compatibilityError: inspection.error,
        schemaVersion: typeof raw?.schemaVersion === 'number' ? raw.schemaVersion : undefined,
        package: typeof raw?.package === 'string' ? raw.package : undefined,
        toolApi: typeof raw?.toolApi === 'number' ? raw.toolApi : undefined,
        harnessApi: typeof raw?.harnessApi === 'number' ? raw.harnessApi : undefined,
        packageVersion: manifest?.packageVersion ??
            (typeof raw?.packageVersion === 'string' ? raw.packageVersion : undefined),
        types: manifest?.types ?? [],
        healthy: [],
        missing: [],
        modified: [],
        stale: {
            healthy: [],
            missing: [],
            modified: [],
        },
        gitignore: gitignoreEntryStatus(root, (manifest && 'gitignore' in manifest
            ? (manifest.gitignore ?? [])
            : [])),
    };
    for (const [destRel, managed] of Object.entries(manifest?.files ?? {})) {
        if (!isManagedFile(managed))
            continue;
        const dest = path.join(root, destRel);
        const bucket = managed.stale ? status.stale : status;
        if (!existsSync(dest)) {
            bucket.missing.push(destRel);
        }
        else if (sha256(readFileSync(dest, 'utf8')) === managed.hash) {
            bucket.healthy.push(destRel);
        }
        else {
            bucket.modified.push(destRel);
        }
    }
    for (const entry of status.gitignore) {
        if (!entry.present)
            status.missing.push(`.gitignore entry: ${entry.pattern}`);
    }
    return status;
}
function isManagedFile(value) {
    if (!value || typeof value !== 'object')
        return false;
    const file = value;
    return (typeof file.source === 'string' &&
        typeof file.hash === 'string' &&
        /^[a-f0-9]{64}$/.test(file.hash));
}
function compatibleManagedPath(source, destRel) {
    const harness = /^harness\/(?:common|docs|fe|be|test)\/(skills|rules|extracts)\/(.+)$/.exec(source);
    if (harness) {
        const allowedDirs = Object.values(AGENT_DIRS).flat();
        return allowedDirs.some((dir) => destRel === `${dir}/${harness[1]}/${harness[2]}`);
    }
    const lexicon = /^lexicon\/([^/]+)$/.exec(source);
    return Boolean(lexicon && destRel === `artifactgraph/lexicon/${lexicon[1]}`);
}
function containedRelativePath(root, destRel) {
    const parts = destRel.split(/[\\/]/);
    if (!destRel ||
        path.isAbsolute(destRel) ||
        parts.some((part) => !part || part === '.' || part === '..')) {
        return null;
    }
    const dest = path.resolve(root, destRel);
    const relative = path.relative(root, dest);
    if (!relative ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)) {
        return null;
    }
    return dest;
}
function safeExistingManagedPath(root, destRel) {
    const dest = containedRelativePath(root, destRel);
    if (!dest)
        return null;
    const stat = lstatSync(dest);
    if (stat.isSymbolicLink() || !stat.isFile())
        return null;
    const realRoot = realpathSync(root);
    const realParent = realpathSync(path.dirname(dest));
    const relative = path.relative(realRoot, realParent);
    if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
        return null;
    return dest;
}
export function pruneProjectAssets(opts) {
    const root = path.resolve(opts.repoRoot);
    const manifestPath = path.join(root, '.artifactgraph', 'install-manifest.json');
    const manifest = assertProjectManifestCompatible(root);
    const result = {
        root,
        manifestPath,
        dryRun: !opts.yes,
        wouldDelete: [],
        deleted: [],
        missing: [],
        preservedModified: [],
        preservedUnsafe: [],
    };
    if (!manifest)
        return result;
    const removeFromManifest = new Set();
    for (const [destRel, managed] of Object.entries(manifest.files)) {
        if (!isManagedFile(managed) || !managed.stale)
            continue;
        if (!compatibleManagedPath(managed.source, destRel)) {
            result.preservedUnsafe.push(destRel);
            continue;
        }
        const dest = containedRelativePath(root, destRel);
        if (!dest) {
            result.preservedUnsafe.push(destRel);
            continue;
        }
        if (!existsSync(dest)) {
            result.missing.push(destRel);
            if (opts.yes)
                removeFromManifest.add(destRel);
            continue;
        }
        const safeDest = safeExistingManagedPath(root, destRel);
        if (!safeDest) {
            result.preservedUnsafe.push(destRel);
            continue;
        }
        if (sha256(readFileSync(safeDest, 'utf8')) !== managed.hash) {
            result.preservedModified.push(destRel);
            continue;
        }
        result.wouldDelete.push(destRel);
        if (opts.yes) {
            unlinkSync(safeDest);
            result.deleted.push(destRel);
            removeFromManifest.add(destRel);
        }
    }
    if (opts.yes && removeFromManifest.size) {
        for (const destRel of removeFromManifest)
            delete manifest.files[destRel];
        writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    }
    return result;
}
function pruneEmptyDirs(root, files) {
    const dirs = new Set();
    for (const file of files) {
        let dir = path.dirname(file);
        while (dir !== root && containedRelativePath(root, path.relative(root, dir))) {
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
            // Leave non-empty, busy, or member-owned directories.
        }
    }
}
/**
 * Remove all manifest-owned harness assets, including stale entries.
 * Modified and unsafe files are preserved and reported.
 */
export function uninstallProjectAssets(opts) {
    const root = path.resolve(opts.repoRoot);
    const manifestPath = path.join(root, '.artifactgraph', 'install-manifest.json');
    const manifest = assertProjectManifestCompatible(root);
    const result = {
        root,
        manifestPath,
        dryRun: !opts.yes,
        wouldDelete: [],
        deleted: [],
        missing: [],
        preservedModified: [],
        preservedUnsafe: [],
        manifestRemoved: false,
        gitignoreRemoved: [],
        gitignorePreservedShared: [],
    };
    if (!manifest) {
        if (opts.yes)
            forgetInstall(root);
        return result;
    }
    for (const [destRel, managed] of Object.entries(manifest.files)) {
        // Keep lexicon and config in the git repo even after deinit
        if (destRel.startsWith('artifactgraph/lexicon/')) {
            result.preservedUnsafe.push(destRel);
            continue;
        }
        if (!isManagedFile(managed) || !compatibleManagedPath(managed.source, destRel)) {
            result.preservedUnsafe.push(destRel);
            continue;
        }
        const dest = containedRelativePath(root, destRel);
        if (!dest) {
            result.preservedUnsafe.push(destRel);
            continue;
        }
        if (!existsSync(dest)) {
            result.missing.push(destRel);
            continue;
        }
        const safeDest = safeExistingManagedPath(root, destRel);
        if (!safeDest) {
            result.preservedUnsafe.push(destRel);
            continue;
        }
        if (sha256(readFileSync(safeDest, 'utf8')) !== managed.hash) {
            result.preservedModified.push(destRel);
            continue;
        }
        result.wouldDelete.push(destRel);
        if (opts.yes) {
            unlinkSync(safeDest);
            result.deleted.push(destRel);
        }
    }
    const ignorePath = path.join(root, '.artifactgraph', '.gitignore');
    if (existsSync(ignorePath)) {
        result.wouldDelete.push('.artifactgraph/.gitignore');
        if (opts.yes) {
            unlinkSync(ignorePath);
            result.deleted.push('.artifactgraph/.gitignore');
        }
    }
    const dbPath = path.join(root, '.artifactgraph', 'index.db');
    if (existsSync(dbPath)) {
        result.wouldDelete.push('.artifactgraph/index.db');
        if (opts.yes) {
            unlinkSync(dbPath);
            result.deleted.push('.artifactgraph/index.db');
        }
    }
    const ownedIgnore = 'gitignore' in manifest
        ? (manifest.gitignore ?? [])
        : [];
    for (const entry of ownedIgnore) {
        if (entry.shared)
            result.gitignorePreservedShared.push(entry.pattern);
    }
    const exclusiveIgnore = ownedIgnore
        .filter((entry) => !entry.shared)
        .map((entry) => entry.pattern);
    if (exclusiveIgnore.length) {
        if (opts.yes) {
            const removed = removeGitignoreEntries(root, exclusiveIgnore);
            result.gitignoreRemoved.push(...removed.removed);
            for (const pattern of removed.removed) {
                result.deleted.push(`.gitignore entry: ${pattern}`);
            }
        }
        else {
            const present = gitignoreEntryStatus(root, exclusiveIgnore.map((pattern) => ({ pattern })));
            for (const entry of present) {
                if (entry.present) {
                    result.wouldDelete.push(`.gitignore entry: ${entry.pattern}`);
                    result.gitignoreRemoved.push(entry.pattern);
                }
            }
        }
    }
    const configPath = path.join(root, 'artifactgraph.json');
    if (existsSync(configPath)) {
        result.wouldDelete.push('artifactgraph.json');
        if (opts.yes) {
            unlinkSync(configPath);
            result.deleted.push('artifactgraph.json');
        }
    }
    const pkgPath = path.join(root, 'package.json');
    if (existsSync(pkgPath) && opts.yes) {
        try {
            const raw = readFileSync(pkgPath, 'utf8');
            const pkg = JSON.parse(raw);
            if (pkg.scripts && pkg.scripts['artifactgraph:rebuild']) {
                delete pkg.scripts['artifactgraph:rebuild'];
                writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
                result.deleted.push('package.json script: artifactgraph:rebuild');
            }
        }
        catch {
            // Ignore cleanup errors
        }
    }
    result.wouldDelete.push('.artifactgraph/install-manifest.json');
    if (opts.yes) {
        unlinkSync(manifestPath);
        result.deleted.push('.artifactgraph/install-manifest.json');
        result.manifestRemoved = true;
        forgetInstall(root);
        pruneEmptyDirs(root, result.deleted.map((rel) => path.join(root, rel)));
    }
    return result;
}
function isExplicitNonHubPath(value) {
    return typeof value === 'string' && value.length > 0 && !value.startsWith('@');
}
function filterLocalCommands(commands) {
    return Object.fromEntries(Object.entries(commands ?? {}).filter(([, argv]) => !argv.some((part) => part.startsWith('@'))));
}
function localRegistriesFromStack(repoRoot, stack) {
    try {
        const preset = loadStackPreset(stack);
        return (preset.registries ?? []).filter((rel) => existsSync(path.join(repoRoot, rel)));
    }
    catch {
        return [];
    }
}
function localTemplatesFromStack(repoRoot, stack) {
    try {
        const preset = loadStackPreset(stack);
        if (!preset.templates?.root)
            return undefined;
        return existsSync(path.join(repoRoot, preset.templates.root))
            ? preset.templates
            : undefined;
    }
    catch {
        return undefined;
    }
}
function defaultVocabularies(types, existing) {
    const hasTest = types.includes('test');
    const next = {
        registryTags: isExplicitNonHubPath(existing?.registryTags)
            ? existing.registryTags
            : 'artifactgraph/lexicon/registry-tags.en.txt',
    };
    if (hasTest) {
        next.testTaxonomy = isExplicitNonHubPath(existing?.testTaxonomy)
            ? existing.testTaxonomy
            : 'artifactgraph/lexicon/testcase-taxonomy.en.txt';
    }
    else if (isExplicitNonHubPath(existing?.testTaxonomy)) {
        next.testTaxonomy = existing.testTaxonomy;
    }
    return next;
}
/**
 * Fresh installs stay generic: never copy product-owned allowlists from stack
 * presets into unrelated repos. Existing configs are migrated in place.
 */
function sanitizeConfig(repoRoot, stack, types) {
    const existing = loadRepoConfig(repoRoot);
    if (existing) {
        return {
            ...existing,
            version: 2,
            projectId: existing.projectId ?? path.basename(repoRoot),
            stack: existing.stack || stack || 'generic',
            mode: existing.mode ?? 'brownfield',
            commands: filterLocalCommands(existing.commands),
            gapSources: (existing.gapSources ?? []).filter((item) => !item.startsWith('@')),
            specRoots: (existing.specRoots ?? []).filter((item) => !item.startsWith('@')),
            hubs: undefined,
            vocabularies: defaultVocabularies(types, existing.vocabularies),
        };
    }
    const base = defaultRepoConfig(path.basename(repoRoot));
    return {
        ...base,
        version: 2,
        stack: stack || 'generic',
        commands: {},
        registries: localRegistriesFromStack(repoRoot, stack),
        gapSources: [],
        specRoots: [],
        hubs: undefined,
        templates: localTemplatesFromStack(repoRoot, stack),
        vocabularies: defaultVocabularies(types),
    };
}
export function installProjectAssets(opts) {
    const root = path.resolve(opts.repoRoot);
    const types = normalizeInstallTypes(opts.types);
    const manifestPath = path.join(root, '.artifactgraph', 'install-manifest.json');
    const previous = assertProjectManifestCompatible(root);
    const nextFiles = {};
    const result = {
        root,
        types,
        configPath: path.join(root, CONFIG_NAME),
        created: [],
        updated: [],
        skipped: [],
        conflicts: [],
        manifestPath,
        gitignore: {
            file: path.join(root, '.gitignore'),
            changed: false,
            entries: [],
            added: [],
        },
    };
    const assets = [...COMMON_ASSETS];
    for (const type of LANE_TYPES) {
        if (types.includes(type))
            assets.push(...TYPE_ASSETS[type]);
    }
    const agentRoots = [
        ...new Set((opts.agents || ['cursor']).flatMap((a) => AGENT_DIRS[a] || [])),
    ];
    const isAgentHarnessPath = (f) => {
        const allowedDirs = Object.values(AGENT_DIRS).flat();
        return allowedDirs.some((dir) => f.startsWith(`${dir}/`));
    };
    const expandedAssets = [];
    for (const [sourceRel, destRel] of assets) {
        if (destRel.startsWith('.cursor/')) {
            for (const agentRoot of agentRoots) {
                expandedAssets.push([sourceRel, destRel.replace('.cursor/', `${agentRoot}/`)]);
            }
        }
        else {
            expandedAssets.push([sourceRel, destRel]);
        }
    }
    let wroteCursorHarness = false;
    let wroteLexicon = false;
    for (const [sourceRel, destRel] of expandedAssets) {
        const source = path.join(packageRoot(), sourceRel);
        const dest = path.join(root, destRel);
        const content = readFileSync(source, 'utf8');
        const nextHash = sha256(content);
        const current = existsSync(dest) ? readFileSync(dest, 'utf8') : null;
        const currentHash = current === null ? null : sha256(current);
        const priorHash = previous?.files[destRel]?.hash;
        if (current === null) {
            writeAtomic(dest, content);
            result.created.push(destRel);
        }
        else if (currentHash === nextHash) {
            result.skipped.push(destRel);
        }
        else if (opts.force || (priorHash && currentHash === priorHash)) {
            writeAtomic(dest, content);
            result.updated.push(destRel);
        }
        else {
            // Shared config skills can overlap across toolkits; skip instead of conflict if already present
            if (destRel.includes('configure-repo-maps') ||
                destRel.includes('legacy-platform') ||
                destRel.includes('configure-legacy-')) {
                result.skipped.push(destRel);
                nextFiles[destRel] = { source: sourceRel, hash: nextHash };
                if (isAgentHarnessPath(destRel))
                    wroteCursorHarness = true;
                if (destRel.startsWith('artifactgraph/'))
                    wroteLexicon = true;
                continue;
            }
            result.conflicts.push(destRel);
            const prior = previous?.files[destRel];
            if (isManagedFile(prior))
                nextFiles[destRel] = { ...prior, stale: undefined };
            continue;
        }
        nextFiles[destRel] = { source: sourceRel, hash: nextHash };
        if (isAgentHarnessPath(destRel))
            wroteCursorHarness = true;
        if (destRel.startsWith('artifactgraph/'))
            wroteLexicon = true;
    }
    for (const [destRel, managed] of Object.entries(previous?.files ?? {})) {
        if (!(destRel in nextFiles) && isManagedFile(managed)) {
            nextFiles[destRel] = { ...managed, stale: true };
            if (isAgentHarnessPath(destRel))
                wroteCursorHarness = true;
            if (destRel.startsWith('artifactgraph/'))
                wroteLexicon = true;
        }
    }
    const config = sanitizeConfig(root, opts.stack, types);
    const configContent = `${JSON.stringify(config, null, 2)}\n`;
    const priorConfig = existsSync(result.configPath)
        ? readFileSync(result.configPath, 'utf8')
        : null;
    const createdConfig = priorConfig === null;
    if (priorConfig === null) {
        writeAtomic(result.configPath, configContent);
        result.created.push(CONFIG_NAME);
    }
    else if (priorConfig === configContent) {
        result.skipped.push(CONFIG_NAME);
    }
    else {
        writeAtomic(result.configPath, configContent);
        result.updated.push(CONFIG_NAME);
    }
    const previousGitignore = previous && 'gitignore' in previous
        ? (previous.gitignore ?? [])
        : [];
    const applied = applyGeneratedGitignore({
        root,
        writtenAgentPaths: opts.writtenAgentPaths,
        targets: opts.agents,
        createdConfig,
        wroteCursorHarness: wroteCursorHarness ||
            result.created.some(isAgentHarnessPath) ||
            result.updated.some(isAgentHarnessPath) ||
            result.skipped.some(isAgentHarnessPath),
        wroteLexicon: wroteLexicon ||
            result.created.some((f) => f.startsWith('artifactgraph/')) ||
            result.updated.some((f) => f.startsWith('artifactgraph/')) ||
            result.skipped.some((f) => f.startsWith('artifactgraph/')),
    });
    const gitignore = mergeGitignoreEntries(previousGitignore, applied.entries);
    result.gitignore = {
        file: applied.file,
        changed: applied.changed,
        entries: gitignore,
        added: applied.added,
    };
    const manifest = {
        schemaVersion: INSTALL_MANIFEST_SCHEMA_VERSION,
        package: INSTALL_MANIFEST_PACKAGE,
        toolApi: INSTALL_MANIFEST_TOOL_API,
        harnessApi: INSTALL_MANIFEST_HARNESS_API,
        packageVersion: packageVersion(),
        types,
        files: nextFiles,
        ...(gitignore.length ? { gitignore } : {}),
    };
    writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const ignorePath = path.join(root, '.artifactgraph', '.gitignore');
    const requiredRules = ['*', '!.gitignore', '!install-manifest.json'];
    const existingRules = existsSync(ignorePath)
        ? readFileSync(ignorePath, 'utf8').split(/\r?\n/).filter(Boolean)
        : [];
    const mergedRules = [...new Set([...existingRules, ...requiredRules])];
    writeAtomic(ignorePath, `${mergedRules.join('\n')}\n`);
    recordInstall(root);
    return result;
}
//# sourceMappingURL=project.js.map