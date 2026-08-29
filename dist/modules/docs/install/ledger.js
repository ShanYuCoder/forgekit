/**
 * Install ledger — remembers which repos received the docskit harness so
 * `uninstall --all` can clean every location without a manual `cd` per repo.
 *
 * State lives outside the CLI install dir (survives `install.sh` upgrades):
 *   $DOCSKIT_STATE_DIR | $XDG_STATE_HOME/docskit | ~/.local/state/docskit/installs.json
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, unlinkSync, writeFileSync, } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const MANIFEST_REL = '.docskit/install-manifest.json';
export function stateDir() {
    if (process.env.DOCSKIT_STATE_DIR)
        return path.resolve(process.env.DOCSKIT_STATE_DIR);
    const base = process.env.XDG_STATE_HOME
        ? path.resolve(process.env.XDG_STATE_HOME)
        : path.join(os.homedir(), '.local', 'state');
    return path.join(base, 'docskit');
}
export function ledgerPath() {
    return path.join(stateDir(), 'installs.json');
}
function normalize(repoRoot) {
    const abs = path.resolve(repoRoot);
    try {
        return realpathSync(abs);
    }
    catch {
        return abs;
    }
}
function hasManifest(repoRoot) {
    return existsSync(path.join(repoRoot, ...MANIFEST_REL.split('/')));
}
/** Raw ledger entries (normalized, not pruned) — for mutation. */
function rawRepos() {
    const file = ledgerPath();
    if (!existsSync(file))
        return [];
    try {
        const doc = JSON.parse(readFileSync(file, 'utf8'));
        const repos = Array.isArray(doc.repos) ? doc.repos : [];
        return [
            ...new Set(repos.filter((r) => typeof r === 'string').map(normalize)),
        ];
    }
    catch {
        return [];
    }
}
/** Registered repos whose manifest still exists (stale entries pruned). */
export function readLedger() {
    return rawRepos().filter(hasManifest);
}
function writeLedger(repos) {
    const file = ledgerPath();
    try {
        mkdirSync(path.dirname(file), { recursive: true });
        const doc = { version: 1, repos: [...new Set(repos)].sort() };
        writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    }
    catch {
        /* best-effort: ledger is an accelerator, never fatal */
    }
}
export function recordInstall(repoRoot) {
    const root = normalize(repoRoot);
    const repos = rawRepos();
    if (!repos.includes(root))
        writeLedger([...repos, root]);
}
export function forgetInstall(repoRoot) {
    const root = normalize(repoRoot);
    const repos = rawRepos();
    if (repos.includes(root))
        writeLedger(repos.filter((r) => r !== root));
}
export function removeLedger() {
    const file = ledgerPath();
    if (!existsSync(file))
        return false;
    try {
        unlinkSync(file);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Scan a directory tree for repos carrying a docskit manifest — used to recover
 * install locations for ledger-less older installs (`uninstall --discover`).
 */
export function discoverInstalls(dir, maxDepth = 5) {
    const found = [];
    const walk = (current, depth) => {
        if (depth > maxDepth)
            return;
        if (hasManifest(current)) {
            found.push(normalize(current));
            return;
        }
        let entries;
        try {
            entries = readdirSync(current);
        }
        catch {
            return;
        }
        for (const name of entries) {
            if (name.startsWith('.') || name === 'node_modules')
                continue;
            const child = path.join(current, name);
            try {
                if (statSync(child).isDirectory())
                    walk(child, depth + 1);
            }
            catch {
                /* skip unreadable */
            }
        }
    };
    walk(path.resolve(dir), 0);
    return [...new Set(found)];
}
//# sourceMappingURL=ledger.js.map