export type EngineName = 'split' | 'merge' | 'check' | 'split_all' | 'normalize' | 'render' | 'publish' | 'legacy_validate' | 'extract_i18n';
export interface EngineResult {
    ok: boolean;
    code: number | null;
    stdout: string;
    stderr: string;
    command: string[];
    cwd: string;
}
export declare function runEngine(name: EngineName, args: string[], opts?: {
    cwd?: string;
    extraArgs?: string[];
}): Promise<EngineResult>;
