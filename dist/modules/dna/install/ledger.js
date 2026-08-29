/**
 * Install ledger used only to locate destination repos during global uninstall.
 *
 * $PLATFORM_DNA_STATE_DIR | $XDG_STATE_HOME/platform-dna |
 * ~/.local/state/platform-dna/installs.json
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, unlinkSync, writeFileSync, } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const MANIFEST_REL = '.platform-dna/install-manifest.json';
export function stateDir() {
    if (process.env.PLATFORM_DNA_STATE_DIR) {
        return path.resolve(process.env.PLATFORM_DNA_STATE_DIR);
    }
    const base = process.env.XDG_STATE_HOME
        ? path.resolve(process.env.XDG_STATE_HOME)
        : path.join(os.homedir(), '.local', 'state');
    return path.join(base, 'platform-dna');
}
export function ledgerPath() {
    return path.join(stateDir(), 'installs.json');
}
function normalize(repoRoot) {
    const absolute = path.resolve(repoRoot);
    try {
        return realpathSync(absolute);
    }
    catch {
        return absolute;
    }
}
function hasManifest(repoRoot) {
    return existsSync(path.join(repoRoot, ...MANIFEST_REL.split('/')));
}
function rawRepos() {
    const file = ledgerPath();
    if (!existsSync(file))
        return [];
    try {
        const document = JSON.parse(readFileSync(file, 'utf8'));
        const repos = Array.isArray(document.repos) ? document.repos : [];
        return [
            ...new Set(repos
                .filter((repo) => typeof repo === 'string')
                .map(normalize)),
        ];
    }
    catch {
        return [];
    }
}
export function readLedger() {
    return rawRepos().filter(hasManifest);
}
function writeLedger(repos) {
    try {
        const file = ledgerPath();
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, `${JSON.stringify({ version: 1, repos: [...new Set(repos)].sort() }, null, 2)}\n`);
    }
    catch {
        // Best effort: the ledger is an uninstall accelerator, never install state.
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
        writeLedger(repos.filter((repo) => repo !== root));
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
                // Skip unreadable and concurrently removed directories.
            }
        }
    };
    walk(path.resolve(dir), 0);
    return [...new Set(found)];
}
//# sourceMappingURL=ledger.js.map