/** Product hubs only — never MCP tooling packages. */
export type ProfileType = 'docs' | 'fe' | 'be' | 'monolith' | 'tests';
export declare const FE_ADAPTERS: readonly ["nuxt4", "nextjs", "dotnet-line"];
export declare const BE_ADAPTERS: readonly ["fastapi", "laravel", "dotnet-integration"];
export type FeAdapterId = (typeof FE_ADAPTERS)[number];
export type BeAdapterId = (typeof BE_ADAPTERS)[number];
export declare function packageRoot(): string;
export declare function packageVersion(): string;
export declare function resolveProjectRoot(explicit?: string): string;
export declare function resolveType(value?: string): ProfileType;
export declare function resolveFeAdapter(value?: string): FeAdapterId;
export declare function resolveBeAdapter(value?: string): BeAdapterId;
