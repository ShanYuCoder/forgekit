export type TestkitType = 'tests' | 'fe';
export declare function packageRoot(): string;
export declare function packageVersion(): string;
export declare function resolveProjectRoot(explicit?: string): string;
export declare function enginePath(...parts: string[]): string;
