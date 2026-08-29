import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { checkboxPrompt } from './prompt.js';
export const OPTIONAL_TOOLKIT_IDS = ['artifactgraph'];
export function parseOptionalToolkits(raw) {
    if (raw === undefined)
        return undefined;
    const value = raw.trim().toLowerCase();
    if (!value || value === 'none')
        return [];
    const selected = [];
    for (const token of value.split(/[,\s]+/).filter(Boolean)) {
        if (!OPTIONAL_TOOLKIT_IDS.includes(token)) {
            throw new Error(`Unknown optional toolkit "${token}". Known: ${OPTIONAL_TOOLKIT_IDS.join(', ')}, none`);
        }
        const id = token;
        if (!selected.includes(id))
            selected.push(id);
    }
    return selected;
}
export async function resolveOptionalToolkits(opts) {
    if (opts.requested !== undefined)
        return opts.requested;
    if (!opts.interactive)
        return [];
    const prompts = opts.prompts ?? { checkbox: checkboxPrompt };
    return prompts.checkbox({
        message: 'Optional toolkits to initialize now (none = skip, add later):',
        choices: [
            {
                value: 'artifactgraph',
                name: 'ArtifactGraph — local registry/tag/parity accelerator',
                checked: false,
            },
        ],
    });
}
export function optionalToolkitInvocations(opts) {
    return opts.selected.map((id) => {
        if (id !== 'artifactgraph') {
            throw new Error(`Unsupported optional toolkit: ${String(id)}`);
        }
        return {
            id,
            command: 'artifactgraph',
            args: [
                'init',
                `--target=${opts.target || 'none'}`,
                `--type=${opts.type === 'docs' ? 'docs' : 'common'}`,
                '--location=local',
                '--yes',
                ...(opts.force ? ['--force'] : []),
                ...(opts.useWsl ? ['--wsl'] : []),
            ],
            cwd: path.resolve(opts.projectRoot),
        };
    });
}
/**
 * Run only explicitly selected, already-installed optional toolkits.
 * A missing executable is a non-fatal hint; Docskit never clones or installs
 * another toolkit implicitly. Other failures are surfaced because the member
 * explicitly requested that initialization.
 */
export function runOptionalToolkits(invocations) {
    const initialized = [];
    const unavailable = [];
    for (const invocation of invocations) {
        const result = spawnSync(invocation.command, invocation.args, {
            cwd: invocation.cwd,
            env: process.env,
            encoding: 'utf8',
            stdio: 'inherit',
        });
        const missing = result.error &&
            'code' in result.error &&
            result.error.code === 'ENOENT';
        if (missing) {
            unavailable.push(invocation.id);
            continue;
        }
        if (result.error || result.status !== 0) {
            throw new Error(`${invocation.command} ${invocation.args.join(' ')} failed (${result.status ?? 'spawn'})${result.error ? `: ${result.error.message}` : ''}`);
        }
        initialized.push(invocation.id);
    }
    return { initialized, unavailable };
}
//# sourceMappingURL=optional.js.map