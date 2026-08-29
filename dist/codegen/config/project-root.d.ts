export type CodegenType = 'fe' | 'be' | 'fullstack';
export type FeAdapterId = 'nuxt4' | 'nextjs' | 'dotnet-line';
export type BeAdapterId = 'fastapi' | 'laravel' | 'dotnet-integration' | 'nestjs';
export type AdapterId = FeAdapterId | BeAdapterId;
export declare function packageRoot(): string;
export declare function packageVersion(): string;
export declare function resolveProjectRoot(explicit?: string): string;
export declare function resolveType(type?: string): CodegenType;
export declare function resolveFeAdapter(adapter?: string): FeAdapterId;
export declare function resolveBeAdapter(adapter?: string): BeAdapterId;
/** Backward-compatible FE resolver. */
export declare function resolveAdapter(adapter?: string): FeAdapterId;
export declare function adapterEngine(adapter: FeAdapterId, kind: 'codegen' | 'unitgen', script: string): string;
