import { type BeAdapterId } from '../config/project-root.js';
export interface EngineResult {
    status: number | null;
    stdout: string;
    stderr: string;
}
export declare function runBeEngine(opts: {
    adapter: BeAdapterId;
    projectRoot: string;
    kind?: 'codegen' | 'unitgen' | 'registry' | 'unit-registry';
    argv?: string[];
    dryRun?: boolean;
}): EngineResult;
