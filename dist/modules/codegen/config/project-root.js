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
    const root = path.resolve(explicit ?? process.env.CODEGENKIT_ROOT ?? process.cwd());
    if (!existsSync(root))
        throw new Error(`Codegenkit project root not found: ${root}`);
    return root;
}
export function resolveType(type) {
    const value = type ?? process.env.CODEGENKIT_TYPE ?? 'fe';
    if (!['fe', 'be', 'fullstack'].includes(value)) {
        throw new Error('--type must be fe | be | fullstack (OpenAPI YAML is Docskit on the docs hub)');
    }
    return value;
}
export function resolveFeAdapter(adapter) {
    const id = (adapter ??
        process.env.CODEGENKIT_FE_ADAPTER ??
        process.env.CODEGENKIT_ADAPTER ??
        'nuxt4');
    if (id !== 'nuxt4' && id !== 'nextjs' && id !== 'dotnet-line') {
        throw new Error('--fe-adapter/--adapter must be nuxt4 | nextjs | dotnet-line');
    }
    const dir = path.join(pkgRoot, 'adapters', id);
    if (!existsSync(dir))
        throw new Error(`Adapter missing: ${id}`);
    return id;
}
export function resolveBeAdapter(adapter) {
    const id = (adapter ??
        process.env.CODEGENKIT_BE_ADAPTER ??
        process.env.CODEGENKIT_ADAPTER ??
        'fastapi');
    if (id !== 'fastapi' && id !== 'laravel' && id !== 'dotnet-integration' && id !== 'nestjs') {
        throw new Error('--be-adapter/--adapter must be fastapi | laravel | dotnet-integration | nestjs');
    }
    const dir = path.join(pkgRoot, 'adapters', id);
    if (!existsSync(dir))
        throw new Error(`Adapter missing: ${id}`);
    return id;
}
/** Backward-compatible FE resolver. */
export function resolveAdapter(adapter) {
    return resolveFeAdapter(adapter);
}
export function adapterEngine(adapter, kind, script) {
    return path.join(pkgRoot, 'adapters', adapter, kind, 'runners', script);
}
//# sourceMappingURL=project-root.js.map