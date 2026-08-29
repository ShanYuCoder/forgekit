import { spawn } from 'node:child_process';
import path from 'node:path';
import { enginesRoot } from '../config/docs-root.js';
const ENGINE_FILES = {
    split: path.join('spec', 'split-bundle.mjs'),
    merge: path.join('spec', 'merge-bundle.mjs'),
    check: path.join('spec', 'split-bundle.mjs'),
    split_all: path.join('spec', 'split-all.mjs'),
    normalize: path.join('spec', 'normalize-bundle-gen.mjs'),
    render: path.join('docs', 'render-docs.mjs'),
    publish: path.join('docs', 'publish.mjs'),
    legacy_validate: path.join('spec', 'legacy-dynamics-validate.mjs'),
    extract_i18n: path.join('spec', 'extract-i18n.mjs'),
};
export function runEngine(name, args, opts = {}) {
    const script = path.join(enginesRoot(), ENGINE_FILES[name]);
    const cwd = path.resolve(opts.cwd ?? process.cwd());
    const argv = [script];
    if (name === 'check')
        argv.push('--check');
    if (opts.extraArgs?.length)
        argv.push(...opts.extraArgs);
    argv.push(...args);
    return new Promise((resolve) => {
        const child = spawn(process.execPath, argv, {
            cwd,
            env: process.env,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk) => {
            stdout += String(chunk);
        });
        child.stderr.on('data', (chunk) => {
            stderr += String(chunk);
        });
        child.on('close', (code) => {
            resolve({
                ok: code === 0,
                code,
                stdout,
                stderr,
                command: [process.execPath, ...argv],
                cwd,
            });
        });
    });
}
//# sourceMappingURL=engines.js.map