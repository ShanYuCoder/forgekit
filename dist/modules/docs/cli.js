/**
 * CLI — install / wire agents / version.
 *
 *
 *   docskit version
 *   docskit init                         # ↑↓ · Space · Enter
 *   docskit init --target=cursor,claude --yes
 */
import { createRequire } from 'node:module';
import { existsSync, lstatSync, realpathSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { packageRoot, defaultDocskitRoot, looksLikeHub } from './config/docs-root.js';
import { installAgents, promptInstallAgents, uninstallAgents } from './install/agents.js';
import { installHarness, pruneHarness, statusHarness, uninstallHarness, scaffoldProductSkeleton, scaffoldQaInbox, } from './install/harness.js';
import { discoverInstalls, ledgerPath, readLedger, removeLedger } from './install/ledger.js';
import { promptLine, selectPrompt } from './install/prompt.js';
import { canonicalGitignorePattern, ensureGitignoreEntries, generatedTargets, } from './install/gitignore.js';
import { optionalToolkitInvocations, parseOptionalToolkits, resolveOptionalToolkits, runOptionalToolkits, } from './install/optional.js';
import { runEngine } from './cli/engines.js';
const require = createRequire(import.meta.url);
function pkgVersion() {
    try {
        const pkg = require(path.join(packageRoot(), 'package.json'));
        return pkg.version ?? '0.0.0';
    }
    catch {
        return '0.0.0';
    }
}
function usage() {
    console.log(`docskit ${pkgVersion()}

Local MCP for arc42 × C4 docs hubs — index IDs, route, and bundle IR engines.

Wire agents + harness (member UX — just run docskit init):
  init [--target=…] [--type=docs|consumer] [--docs-root <path>] [--yes] [--wsl]
       [--with=artifactgraph|none] [--artifactgraph | --no-artifactgraph]
       [--location=local|global] [--print-config <agent>] [--mcp-file <path>]
       # no flags → TTY: agents → lane → optional toolkits → MCP + harness
  install …   # deprecated alias → init

Repo lifecycle:
  harness install [--type=docs|consumer] [--project-root <path>] [--force]
  status [--project-root <path>]
  prune [--project-root <path>] [--yes]   # dry-run unless --yes
  deinit [--project-root <path>] [--yes]  # remove this repo's harness + local MCP

Global uninstall (run anywhere; removes all repo installs + MCP + CLI):
  uninstall [--discover <dir>] [--yes]     # dry-run/confirm unless --yes

Advanced/backward-compatible uninstall filters:
  uninstall --scope=all-repos|mcp-local|mcp-global|cli|all
            [--project-root <path>] [--target=<agents>] [--location=local|global]

Engines (cwd or --project-root):
  split [--check] -- <bundle.yaml...>
  merge -- <bundle.yaml...>
  split-all [--root <dir>] [--check]
  normalize -- <bundle.yaml...>
  render [--yaml-root ...] [--md-root ...] [--legacy-root ...] [--no-index]
  publish
  render-common
  legacy-validate -- <_legacy.dynamics.yaml...>
  openapi:gen [--spec <01-backend-spec.yaml|dir>] [--dry-run] [--force]
  openapi:render
  openapi:build
  api:check [--spec <01-backend-spec.yaml|dir>]

Other:
  version
  help

Docs: docs/INIT.md · docs/INSTALL.md · README.md

Env:
  DOCSKIT_ROOT   project docs hub; otherwise cwd if it has architecture/

Init always writes project-local MCP configs into the current repo.
--location=global remains available for CI/rootless wiring.
`);
    process.exit(1);
}
function arg(flag) {
    const eq = process.argv.find((a) => a.startsWith(`${flag}=`));
    if (eq)
        return eq.slice(flag.length + 1) || undefined;
    const i = process.argv.indexOf(flag);
    return i >= 0 ? process.argv[i + 1] : undefined;
}
function has(flag) {
    return process.argv.includes(flag);
}
function requestedOptionalToolkits() {
    const enable = has('--artifactgraph');
    const disable = has('--no-artifactgraph');
    const withArg = arg('--with');
    if (enable && disable) {
        throw new Error('Use only one of --artifactgraph or --no-artifactgraph');
    }
    if ((enable || disable) && withArg !== undefined) {
        throw new Error('Use --with or --artifactgraph/--no-artifactgraph, not both');
    }
    if (enable)
        return ['artifactgraph'];
    if (disable)
        return [];
    return parseOptionalToolkits(withArg);
}
async function resolveInitLane() {
    const flagged = arg('--type');
    const docsRootFlag = arg('--docs-root');
    const interactive = !has('--yes') && !flagged && Boolean(process.stdin.isTTY && process.stdout.isTTY);
    let type = flagged ?? 'docs';
    if (interactive) {
        type = await selectPrompt({
            message: 'Which Docskit lane?',
            defaultIndex: 0,
            choices: [
                { value: 'docs', name: 'docs — architecture authoring hub' },
                { value: 'consumer', name: 'consumer — FE/BE/tests lookup only' },
            ],
        });
    }
    if (type !== 'docs' && type !== 'consumer') {
        throw new Error('--type must be docs | consumer');
    }
    let docsRoot = docsRootFlag;
    if (type === 'consumer' && !docsRoot) {
        const cwdLooksLikeHub = looksLikeHub(process.cwd());
        if (!cwdLooksLikeHub && interactive) {
            docsRoot = await promptLine('Docs hub path for DOCSKIT_ROOT (absolute path with architecture/): ');
            if (!docsRoot)
                throw new Error('consumer lane requires --docs-root when cwd is not a docs hub');
        }
        else if (!cwdLooksLikeHub && !defaultDocskitRoot()) {
            throw new Error('consumer lane requires --docs-root when cwd is not a docs hub');
        }
    }
    return { type, docsRoot };
}
async function runInitAgents(opts = {}) {
    if (opts.deprecatedAlias) {
        console.error('note: `install` is deprecated — use `docskit init`');
    }
    try {
        if (arg('--print-config')) {
            await installAgents({
                target: arg('--target'),
                location: arg('--location') ?? 'local',
                yes: has('--yes'),
                useWsl: has('--wsl'),
                mcpFile: arg('--mcp-file'),
                printConfig: arg('--print-config'),
                docsRoot: arg('--docs-root'),
            });
            return;
        }
        const projectRoot = path.resolve(arg('--project-root') ?? process.cwd());
        let target = arg('--target');
        const interactiveAgents = !has('--yes') && !target && Boolean(process.stdin.isTTY && process.stdout.isTTY);
        if (interactiveAgents) {
            const targets = await promptInstallAgents();
            target = targets.length > 0 ? targets.join(',') : 'none';
        }
        const lane = await resolveInitLane();
        const optional = await resolveOptionalToolkits({
            interactive: !has('--yes') && Boolean(process.stdin.isTTY && process.stdout.isTTY),
            requested: requestedOptionalToolkits(),
        });
        let defaultLanguage = arg('--default-lang');
        if (lane.type === 'docs' && !defaultLanguage && !has('--yes') && Boolean(process.stdin.isTTY && process.stdout.isTTY)) {
            defaultLanguage = await promptLine('\nDefault language code for i18n (e.g. vi, en, ja) [en]: ');
            if (!defaultLanguage)
                defaultLanguage = 'en';
        }
        if (lane.type === 'docs') {
            scaffoldProductSkeleton(projectRoot);
            scaffoldQaInbox(projectRoot);
        }
        const result = await installAgents({
            target,
            location: arg('--location') ?? 'local',
            yes: has('--yes'),
            useWsl: has('--wsl'),
            mcpFile: arg('--mcp-file'),
            docsRoot: lane.docsRoot ?? arg('--docs-root'),
        });
        console.log(`Wired docskit → ${result.targets.join(', ') || '(none)'} (${result.location})`);
        for (const w of result.written) {
            console.log(`  ${w.agent}: ${w.path}`);
        }
        for (const s of result.skipped)
            console.log(`  skip: ${s}`);
        const intended = generatedTargets({
            projectRoot,
            location: result.location,
            written: result.written.map((w) => w.path),
            harnessInstalled: true,
            targets: result.targets,
        });
        const ensured = ensureGitignoreEntries(projectRoot, intended.map((entry) => entry.pattern));
        const addedCanonical = new Set(ensured.added.map(canonicalGitignorePattern));
        // Claim shared entries always (status/deinit); claim exclusive only when
        // this run actually appended them so we never steal member-authored lines.
        const claimed = intended.filter((entry) => entry.shared || addedCanonical.has(canonicalGitignorePattern(entry.pattern)));
        const harness = installHarness({
            projectRoot,
            force: has('--force'),
            type: lane.type,
            gitignoreEntries: claimed,
            targets: result.targets,
            defaultLanguage,
        });
        for (const file of harness.written)
            console.log(`  wrote: ${file}`);
        for (const file of harness.unchanged)
            console.log(`  unchanged: ${file}`);
        for (const file of harness.skipped)
            console.log(`  skip customized: ${file} (use --force)`);
        console.log(`Harness (${lane.type}): ${harness.written.length} written, ${harness.unchanged.length} unchanged`);
        console.log(`manifest: ${harness.manifest}`);
        console.log(`gitignore: ${ensured.changed ? 'updated' : 'unchanged'} ${ensured.file}` +
            (ensured.added.length ? ` (+${ensured.added.join(', ')})` : ''));
        if (optional.length) {
            const optionalResult = runOptionalToolkits(optionalToolkitInvocations({
                selected: optional,
                projectRoot,
                target: result.targets.join(',') || 'none',
                type: lane.type,
                force: has('--force'),
                useWsl: has('--wsl'),
            }));
            for (const id of optionalResult.initialized) {
                console.log(`Optional toolkit initialized: ${id}`);
            }
            for (const id of optionalResult.unavailable) {
                console.log(`Optional toolkit unavailable: ${id} — install it, then run ` +
                    `\`${id} init --target=${result.targets.join(',') || 'none'} ` +
                    `--type=${lane.type === 'docs' ? 'docs' : 'common'} --yes\``);
            }
        }
        else {
            console.log('Optional toolkits: skipped (add later with --with=artifactgraph)');
        }
        const configuredRoot = lane.docsRoot ?? arg('--docs-root') ?? defaultDocskitRoot();
        console.log(`DOCSKIT_ROOT: ${configuredRoot || '(rootless; use tool docsRoot)'}`);
        console.log('Restart agent(s), then try tool docskit_list_ids');
        console.log(`
  ---
  tip: Docskit cross-repo routing relies on Platform DNA.
       If not already done, please install and initialize it:
       1. curl -fsSL https://raw.githubusercontent.com/raintr91/platform-dna/main/install.sh | bash
       2. platform-dna init
       Then use /configure-repo-maps to set up your repository roots.
  ---`);
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
}
function runHarness() {
    const action = process.argv[3];
    if (action === 'status') {
        runHarnessStatus();
        return;
    }
    if (action === 'prune') {
        runHarnessPrune();
        return;
    }
    if (action !== 'install')
        usage();
    try {
        const type = arg('--type') ?? 'docs';
        if (type !== 'docs' && type !== 'consumer') {
            throw new Error('--type must be docs | consumer');
        }
        const projectRoot = path.resolve(arg('--project-root') ?? process.cwd());
        const intended = generatedTargets({
            projectRoot,
            location: 'local',
            written: [],
            harnessInstalled: true,
        });
        const ensured = ensureGitignoreEntries(projectRoot, intended.map((entry) => entry.pattern));
        const addedCanonical = new Set(ensured.added.map(canonicalGitignorePattern));
        const claimed = intended.filter((entry) => entry.shared || addedCanonical.has(canonicalGitignorePattern(entry.pattern)));
        const result = installHarness({
            projectRoot,
            force: has('--force'),
            type,
            gitignoreEntries: claimed,
        });
        for (const file of result.written)
            console.log(`  wrote: ${file}`);
        for (const file of result.unchanged)
            console.log(`  unchanged: ${file}`);
        for (const file of result.skipped)
            console.log(`  skip customized: ${file} (use --force)`);
        for (const file of result.stale)
            console.log(`  stale: ${file}`);
        console.log(`manifest: ${result.manifest}`);
        console.log(`gitignore: ${ensured.changed ? 'updated' : 'unchanged'} ${ensured.file}` +
            (ensured.added.length ? ` (+${ensured.added.join(', ')})` : ''));
        console.log(`Harness: ${result.written.length} written, ${result.unchanged.length} unchanged, ${result.skipped.length} skipped`);
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
}
function runHarnessStatus() {
    try {
        const result = statusHarness({ projectRoot: arg('--project-root') });
        if (!result.installed) {
            console.log(`Harness: not installed (${result.manifest})`);
            return;
        }
        for (const file of result.modified)
            console.log(`  modified: ${file}`);
        for (const file of result.missing)
            console.log(`  missing: ${file}`);
        for (const file of result.stale)
            console.log(`  stale: ${file}`);
        for (const file of result.staleModified)
            console.log(`  stale modified: ${file}`);
        for (const file of result.staleMissing)
            console.log(`  stale missing: ${file}`);
        for (const entry of result.gitignore) {
            if (entry.status === 'missing') {
                console.log(`  missing gitignore: ${entry.pattern}${entry.shared ? ' (shared)' : ''}`);
            }
        }
        const missingIgnore = result.gitignore.filter((e) => e.status === 'missing').length;
        console.log(`Harness ${result.version}: ${result.current.length} current, ${result.modified.length} modified, ${result.missing.length} missing, ${result.stale.length + result.staleModified.length + result.staleMissing.length} stale, ${missingIgnore} gitignore missing`);
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
}
function runHarnessPrune() {
    try {
        const result = pruneHarness({
            projectRoot: arg('--project-root'),
            yes: has('--yes'),
        });
        for (const file of result.wouldDelete)
            console.log(`  would delete: ${file}`);
        for (const file of result.deleted)
            console.log(`  deleted: ${file}`);
        for (const file of result.preservedModified)
            console.log(`  preserve modified: ${file}`);
        for (const file of result.missing)
            console.log(`  already missing: ${file}`);
        console.log(result.dryRun
            ? `Prune dry-run: ${result.wouldDelete.length} stale managed files (pass --yes to delete)`
            : `Pruned: ${result.deleted.length} stale managed files`);
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
}
const UNINSTALL_SCOPES = [
    'repo',
    'all-repos',
    'mcp-local',
    'mcp-global',
    'cli',
    'all',
];
function cliLayout() {
    const installDir = process.env.DOCSKIT_INSTALL_DIR
        ? path.resolve(process.env.DOCSKIT_INSTALL_DIR)
        : path.join(os.homedir(), '.docskit');
    const binDir = process.env.DOCSKIT_BIN_DIR
        ? path.resolve(process.env.DOCSKIT_BIN_DIR)
        : path.join(os.homedir(), '.local', 'bin');
    return { installDir, binDir };
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
function realOrSelf(file) {
    try {
        return realpathSync(file);
    }
    catch {
        return file;
    }
}
function removeCliToolkit(dryRun) {
    const { installDir, binDir } = cliLayout();
    const removed = [];
    const wouldRemove = [];
    const skipped = [];
    const here = realOrSelf(process.cwd());
    const targets = [path.join(binDir, 'docskit'), path.join(binDir, 'docskit-mcp'), installDir];
    for (const target of targets) {
        if (!lexists(target))
            continue;
        if (target === installDir && realOrSelf(target) === here) {
            skipped.push(`${target} (running from here — remove manually)`);
            continue;
        }
        if (dryRun) {
            wouldRemove.push(target);
            continue;
        }
        try {
            rmSync(target, { recursive: true, force: true });
            removed.push(target);
        }
        catch (err) {
            skipped.push(`${target} (${err instanceof Error ? err.message : String(err)})`);
        }
    }
    return { removed, wouldRemove, skipped };
}
function repoTargets(flags) {
    const set = new Set(readLedger());
    if (flags.discoverDir)
        for (const repo of discoverInstalls(flags.discoverDir))
            set.add(repo);
    return [...set];
}
function runScope(scope, flags) {
    const yes = flags.yes;
    const cwd = flags.projectRoot ? path.resolve(flags.projectRoot) : process.cwd();
    const doRepoHarness = (root) => {
        console.log(`repo: ${root}`);
        const harness = uninstallHarness({ projectRoot: root, yes });
        for (const file of harness.wouldDelete)
            console.log(`  would delete: ${file}`);
        for (const file of harness.deleted)
            console.log(`  deleted: ${file}`);
        for (const file of harness.preservedModified)
            console.log(`  preserve modified: ${file}`);
        if (harness.registry)
            console.log(`  registry: ${harness.registry}`);
        if (harness.manifestRemoved)
            console.log(`  manifest removed: ${harness.manifest}`);
    };
    const doMcp = (location, root) => {
        const agents = uninstallAgents({ target: flags.target ?? 'all', location, yes, cwd: root });
        if (!agents.removed.length) {
            console.log(`  mcp (${location}): no docskit entry`);
            return;
        }
        for (const entry of agents.removed) {
            console.log(`  ${yes ? 'unwired' : 'would unwire'} (${location}): ${entry}`);
        }
    };
    const doCli = () => {
        const cli = removeCliToolkit(!yes);
        for (const file of cli.wouldRemove)
            console.log(`  would remove: ${file}`);
        for (const file of cli.removed)
            console.log(`  removed: ${file}`);
        for (const file of cli.skipped)
            console.log(`  skip: ${file}`);
    };
    switch (scope) {
        case 'repo':
            doRepoHarness(cwd);
            if (!flags.keepMcp)
                doMcp('local', cwd);
            break;
        case 'all-repos': {
            const repos = repoTargets(flags);
            if (!repos.length)
                console.log('  (no registered repos — try --discover <dir>)');
            for (const root of repos) {
                doRepoHarness(root);
                if (!flags.keepMcp)
                    doMcp('local', root);
            }
            break;
        }
        case 'mcp-local':
            doMcp('local', cwd);
            break;
        case 'mcp-global':
            doMcp('global', cwd);
            break;
        case 'cli':
            doCli();
            break;
        case 'all': {
            const repos = repoTargets(flags);
            for (const root of repos) {
                doRepoHarness(root);
                doMcp('local', root);
            }
            doMcp('global', cwd);
            doCli();
            if (yes) {
                if (removeLedger())
                    console.log(`  ledger removed: ${ledgerPath()}`);
            }
            else {
                console.log(`  would remove ledger: ${ledgerPath()}`);
            }
            break;
        }
    }
}
async function runUninstall(defaultScope) {
    const flags = {
        yes: has('--yes'),
        keepMcp: has('--keep-mcp'),
        target: arg('--target'),
        location: arg('--location'),
        projectRoot: arg('--project-root'),
        discoverDir: arg('--discover'),
    };
    try {
        let scope;
        const scopeArg = arg('--scope');
        if (defaultScope === 'repo') {
            scope = 'repo';
        }
        else if (has('--all')) {
            scope = 'all';
        }
        else if (scopeArg) {
            if (!UNINSTALL_SCOPES.includes(scopeArg)) {
                throw new Error(`--scope must be one of: ${UNINSTALL_SCOPES.join(', ')}`);
            }
            scope = scopeArg;
        }
        else {
            scope = defaultScope;
        }
        const interactive = process.stdin.isTTY && !flags.yes;
        if (interactive) {
            console.log(`\nPreview (${scope}):`);
            runScope(scope, { ...flags, yes: false });
            const confirm = await selectPrompt({
                message: defaultScope === 'repo'
                    ? 'Apply docskit deinit for this repo?'
                    : 'Apply global docskit uninstall (all repos + MCP + CLI)?',
                defaultIndex: 1,
                choices: [
                    { value: 'no', name: 'No — cancel' },
                    { value: 'yes', name: 'Yes — remove now' },
                ],
            });
            if (confirm !== 'yes') {
                console.log('Cancelled.');
                return;
            }
            console.log(`\nApplying (${scope}):`);
            runScope(scope, { ...flags, yes: true });
            console.log(`\nUninstalled (${scope}).`);
            return;
        }
        runScope(scope, flags);
        console.log(flags.yes
            ? `\nUninstalled (${scope}).`
            : `\nDry-run (${scope}) — pass --yes to apply.`);
    }
    catch (err) {
        if (err instanceof Error && err.message === 'cancelled') {
            console.log('\nCancelled.');
            return;
        }
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
}
function afterDashDash() {
    const i = process.argv.indexOf('--');
    return i >= 0 ? process.argv.slice(i + 1) : process.argv.slice(3).filter((a) => !a.startsWith('-'));
}
async function runNamedEngine(name, extraArgs = []) {
    const cwd = path.resolve(arg('--project-root') ?? process.cwd());
    const paths = afterDashDash();
    const result = await runEngine(name, paths, { cwd, extraArgs });
    if (result.stdout)
        process.stdout.write(result.stdout);
    if (result.stderr)
        process.stderr.write(result.stderr);
    process.exit(result.ok ? 0 : 1);
}
async function main() {
    const cmd = process.argv[2];
    if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h')
        usage();
    if (cmd === 'version' || cmd === '--version' || cmd === '-V') {
        console.log(`docskit ${pkgVersion()}`);
        console.log(`packageRoot ${packageRoot()}`);
        console.log(`DOCSKIT_ROOT ${defaultDocskitRoot()}`);
        return;
    }
    if (cmd === 'init') {
        await runInitAgents();
        return;
    }
    if (cmd === 'install') {
        await runInitAgents({ deprecatedAlias: true });
        return;
    }
    if (cmd === 'harness') {
        runHarness();
        return;
    }
    if (cmd === 'status') {
        runHarnessStatus();
        return;
    }
    if (cmd === 'prune') {
        runHarnessPrune();
        return;
    }
    if (cmd === 'deinit') {
        await runUninstall('repo');
        return;
    }
    if (cmd === 'uninstall') {
        await runUninstall('all');
        return;
    }
    if (cmd === 'split') {
        await runNamedEngine(has('--check') ? 'check' : 'split');
        return;
    }
    if (cmd === 'merge') {
        await runNamedEngine('merge');
        return;
    }
    if (cmd === 'split-all') {
        const extra = [];
        if (arg('--root'))
            extra.push('--root', arg('--root'));
        if (has('--check'))
            extra.push('--check');
        await runNamedEngine('split_all', extra);
        return;
    }
    if (cmd === 'normalize') {
        await runNamedEngine('normalize');
        return;
    }
    if (cmd === 'extract-i18n') {
        const extra = [];
        if (arg('--root'))
            extra.push('--root', arg('--root'));
        await runNamedEngine('extract_i18n', extra);
        return;
    }
    if (cmd === 'render') {
        const extra = [];
        for (const flag of ['--yaml-root', '--md-root', '--legacy-root']) {
            const v = arg(flag);
            if (v)
                extra.push(flag, v);
        }
        if (has('--no-index'))
            extra.push('--no-index');
        await runNamedEngine('render', extra);
        return;
    }
    if (cmd === 'publish') {
        await runNamedEngine('publish');
        return;
    }
    if (cmd === 'render-common') {
        const isLowercase = existsSync(path.join(process.cwd(), 'product', 'surfaces', 'common'));
        const yamlRoot = isLowercase ? 'product/surfaces/common/yaml' : 'Surfaces/Common/yaml';
        const mdRoot = isLowercase ? 'product/surfaces/common/md' : 'Surfaces/Common/md';
        const legacyRoot = isLowercase ? 'product/surfaces/common' : 'Surfaces/Common';
        await runNamedEngine('render', [
            '--yaml-root',
            yamlRoot,
            '--md-root',
            mdRoot,
            '--legacy-root',
            legacyRoot,
            '--no-index',
        ]);
        return;
    }
    if (cmd === 'legacy-validate') {
        await runNamedEngine('legacy_validate');
        return;
    }
    if (cmd === 'api:check') {
        const script = path.join(packageRoot(), 'scripts', 'backend-api', 'check-backend-spec.mjs');
        const { spawnSync } = await import('node:child_process');
        const extra = process.argv.slice(process.argv.indexOf(cmd) + 1);
        const res = spawnSync(process.execPath, [script, ...extra], { stdio: 'inherit' });
        if (res.status !== 0)
            process.exit(res.status ?? 1);
        return;
    }
    if (cmd === 'openapi:gen') {
        const script = path.join(packageRoot(), 'scripts', 'backend-api', 'gen-openapi.mjs');
        const { spawnSync } = await import('node:child_process');
        const extra = process.argv.slice(process.argv.indexOf(cmd) + 1);
        const res = spawnSync(process.execPath, [script, ...extra], { stdio: 'inherit' });
        if (res.status !== 0)
            process.exit(res.status ?? 1);
        return;
    }
    if (cmd === 'openapi:render') {
        const script = path.join(packageRoot(), 'scripts', 'backend-api', 'render-openapi.mjs');
        const { spawnSync } = await import('node:child_process');
        const res = spawnSync(process.execPath, [script], { stdio: 'inherit' });
        if (res.status !== 0)
            process.exit(res.status ?? 1);
        return;
    }
    if (cmd === 'openapi:build') {
        const script = path.join(packageRoot(), 'scripts', 'backend-api', 'build-openapi-ui.mjs');
        const { spawnSync } = await import('node:child_process');
        const res = spawnSync(process.execPath, [script], { stdio: 'inherit' });
        if (res.status !== 0)
            process.exit(res.status ?? 1);
        return;
    }
    usage();
}
main();
//# sourceMappingURL=cli.js.map