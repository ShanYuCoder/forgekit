import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export function packageRoot() {
    return pkgRoot;
}
export function packageVersion() {
    return JSON.parse(readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'))
        .version ?? '0.0.0';
}
export function resolveProjectRoot(explicit) {
    const root = path.resolve(explicit ?? process.env.TESTKIT_ROOT ?? process.cwd());
    if (!existsSync(root))
        throw new Error(`Testkit project root not found: ${root}`);
    return root;
}
export function enginePath(...parts) {
    return path.join(pkgRoot, 'engines', ...parts);
}
//# sourceMappingURL=project-root.js.map