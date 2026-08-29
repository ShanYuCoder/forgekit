import { type FeAdapterId } from '../config/project-root.js';
type EngineResult = {
    status: number | null;
    stdout: string;
    stderr: string;
};
export declare function runAdapterEngine(opts: {
    adapter: FeAdapterId;
    kind: 'codegen' | 'unitgen';
    script: 'generate.mjs' | 'validate-registry.mjs';
    projectRoot: string;
    docsRoot?: string;
    argv?: string[];
    dryRun?: boolean;
}): {
    status: number | null;
    stdout: string;
    stderr: string;
};
/** Surface-common UI inventory + stubs — adapters/shared/common-gen.mjs. */
export declare function runCommonGen(opts: {
    adapter: FeAdapterId;
    projectRoot: string;
    docsRoot?: string;
    argv?: string[];
    dryRun?: boolean;
}): EngineResult;
/** Generate CSS variables from yaml design tokens — adapters/shared/css-gen.mjs. */
export declare function runCssGen(opts: {
    adapter: FeAdapterId;
    projectRoot: string;
    docsRoot?: string;
    argv?: string[];
    dryRun?: boolean;
}): EngineResult;
/** Next.js (and fullstack) FE↔BE contract schemas — lives under adapters/nextjs/contractgen. */
export declare function runContractEngine(opts: {
    projectRoot: string;
    docsRoot?: string;
    argv?: string[];
    dryRun?: boolean;
    registry?: boolean;
}): EngineResult;
export {};
