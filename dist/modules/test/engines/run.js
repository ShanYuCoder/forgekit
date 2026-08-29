import { spawnSync } from 'node:child_process';
import { enginePath } from '../config/project-root.js';
export function runEngine(opts) {
    const engine = enginePath(...opts.engineRel);
    const result = spawnSync(process.execPath, [engine, ...(opts.argv ?? [])], {
        cwd: opts.projectRoot,
        encoding: 'utf8',
        env: { ...process.env, TESTKIT_ROOT: opts.projectRoot, ...opts.env },
    });
    return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}
//# sourceMappingURL=run.js.map