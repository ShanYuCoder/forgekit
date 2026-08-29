import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const FE_ADAPTERS = ['nuxt4', 'nextjs', 'dotnet-line'];
export const BE_ADAPTERS = ['fastapi', 'laravel', 'dotnet-integration'];
export function packageRoot() {
    return root;
}
export function packageVersion() {
    return JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version ?? '0.0.0';
}
export function resolveProjectRoot(explicit) {
    const target = path.resolve(explicit ?? process.env.PLATFORM_DNA_ROOT ?? process.cwd());
    if (!existsSync(target))
        throw new Error(`Project root not found: ${target}`);
    return target;
}
const PROFILE_TYPES = ['docs', 'fe', 'be', 'monolith', 'tests'];
export function resolveType(value) {
    const type = value ?? 'docs';
    if (!PROFILE_TYPES.includes(type)) {
        throw new Error('--type must be docs | fe | be | monolith | tests (docs/code hubs only; not MCP packages)');
    }
    return type;
}
export function resolveFeAdapter(value) {
    const adapter = value ?? 'nuxt4';
    if (!FE_ADAPTERS.includes(adapter)) {
        throw new Error(`--fe-adapter must be ${FE_ADAPTERS.join(' | ')}`);
    }
    return adapter;
}
export function resolveBeAdapter(value) {
    const adapter = value ?? 'fastapi';
    if (!BE_ADAPTERS.includes(adapter)) {
        throw new Error(`--be-adapter must be ${BE_ADAPTERS.join(' | ')}`);
    }
    return adapter;
}
//# sourceMappingURL=project-root.js.map