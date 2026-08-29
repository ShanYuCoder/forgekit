import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { adapterEngine, packageRoot } from '../config/project-root.js';
function runDotnetLine(opts) {
    if (opts.kind === 'unitgen') {
        return {
            status: 1,
            stdout: '',
            stderr: 'dotnet-line bundles test outputs into gen; separate unit-gen/unit-registry is not supported.\n',
        };
    }
    const command = opts.script === 'validate-registry.mjs' ? 'registry' : opts.dryRun ? 'dry' : 'write';
    const argv = opts.argv.filter((value) => value !== '--dry-run' && value !== '--dry');
    if (argv[0] === 'registry' || argv[0] === 'dry' || argv[0] === 'write')
        argv.shift();
    const project = path.join(packageRoot(), 'adapters', 'dotnet-line', 'codegen', 'runners', 'LineGen', 'LineGen.csproj');
    const executable = process.env.CODEGENKIT_DOTNET || 'dotnet';
    const result = spawnSync(executable, ['run', '--project', project, '--', command, ...argv], {
        cwd: opts.projectRoot,
        encoding: 'utf8',
        env: opts.env,
    });
    if (result.error?.code === 'ENOENT') {
        return {
            status: 1,
            stdout: '',
            stderr: `No .NET runtime found; set CODEGENKIT_DOTNET or install dotnet (.NET 8 SDK required).\n`,
        };
    }
    return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}
export function runAdapterEngine(opts) {
    const argv = [...(opts.argv ?? [])];
    if (opts.dryRun && opts.script === 'generate.mjs' && !argv.includes('--dry-run')) {
        argv.push('--dry-run');
    }
    const env = {
        ...process.env,
        CODEGENKIT_ROOT: opts.projectRoot,
        CODEGENKIT_ADAPTER: opts.adapter,
    };
    if (opts.docsRoot)
        env.CODEGENKIT_DOCS_ROOT = opts.docsRoot;
    if (opts.adapter === 'dotnet-line') {
        return runDotnetLine({ ...opts, argv, env });
    }
    const engine = adapterEngine(opts.adapter, opts.kind, opts.script);
    const result = spawnSync(process.execPath, [engine, ...argv], {
        cwd: opts.projectRoot,
        encoding: 'utf8',
        env,
    });
    return {
        status: result.status,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
    };
}
/** Surface-common UI inventory + stubs — adapters/shared/common-gen.mjs. */
export function runCommonGen(opts) {
    if (opts.adapter === 'dotnet-line') {
        return {
            status: 1,
            stdout: '',
            stderr: 'gen-common is web FE only (nuxt4 | nextjs).\n',
        };
    }
    const argv = [...(opts.argv ?? [])];
    if (opts.dryRun && !argv.includes('--dry-run') && !argv.includes('--dry')) {
        argv.push('--dry-run');
    }
    const env = {
        ...process.env,
        CODEGENKIT_ROOT: opts.projectRoot,
        CODEGENKIT_ADAPTER: opts.adapter,
    };
    if (opts.docsRoot)
        env.CODEGENKIT_DOCS_ROOT = opts.docsRoot;
    const engine = path.join(packageRoot(), 'adapters', 'shared', 'common-gen.mjs');
    const result = spawnSync(process.execPath, [engine, ...argv], {
        cwd: opts.projectRoot,
        encoding: 'utf8',
        env,
    });
    return {
        status: result.status,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
    };
}
/** Generate CSS variables from yaml design tokens — adapters/shared/css-gen.mjs. */
export function runCssGen(opts) {
    const argv = [...(opts.argv ?? [])];
    if (opts.dryRun && !argv.includes('--dry-run') && !argv.includes('--dry')) {
        argv.push('--dry-run');
    }
    const env = {
        ...process.env,
        CODEGENKIT_ROOT: opts.projectRoot,
        CODEGENKIT_ADAPTER: opts.adapter,
    };
    if (opts.docsRoot)
        env.CODEGENKIT_DOCS_ROOT = opts.docsRoot;
    const engine = path.join(packageRoot(), 'adapters', 'shared', 'css-gen.mjs');
    // ensure --adapter=... is passed down to css-gen.mjs if not provided
    if (!argv.some(a => a.startsWith('--adapter='))) {
        argv.push(`--adapter=${opts.adapter}`);
    }
    const result = spawnSync(process.execPath, [engine, ...argv], {
        cwd: opts.projectRoot,
        encoding: 'utf8',
        env,
    });
    return {
        status: result.status,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
    };
}
/** Next.js (and fullstack) FE↔BE contract schemas — lives under adapters/nextjs/contractgen. */
export function runContractEngine(opts) {
    const argv = [...(opts.argv ?? [])];
    if (opts.dryRun && !opts.registry && !argv.includes('--dry-run')) {
        argv.push('--dry-run');
    }
    const env = {
        ...process.env,
        CODEGENKIT_ROOT: opts.projectRoot,
        CODEGENKIT_ADAPTER: 'nextjs',
    };
    if (opts.docsRoot)
        env.CODEGENKIT_DOCS_ROOT = opts.docsRoot;
    const script = opts.registry ? 'validate-registry.mjs' : 'generate.mjs';
    const engine = path.join(packageRoot(), 'adapters', 'nextjs', 'contractgen', 'runners', script);
    const result = spawnSync(process.execPath, [engine, ...argv], {
        cwd: opts.projectRoot,
        encoding: 'utf8',
        env,
    });
    return {
        status: result.status,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
    };
}
//# sourceMappingURL=run.js.map