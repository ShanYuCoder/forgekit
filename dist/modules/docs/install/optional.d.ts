import { type CheckboxChoice } from './prompt.js';
import type { DocskitHarnessType } from './harness.js';
export declare const OPTIONAL_TOOLKIT_IDS: readonly ["artifactgraph"];
export type OptionalToolkitId = (typeof OPTIONAL_TOOLKIT_IDS)[number];
export interface OptionalToolkitPrompts {
    checkbox<T extends string>(opts: {
        message: string;
        choices: CheckboxChoice<T>[];
    }): Promise<T[]>;
}
export declare function parseOptionalToolkits(raw: string | undefined): OptionalToolkitId[] | undefined;
export declare function resolveOptionalToolkits(opts: {
    interactive: boolean;
    requested?: OptionalToolkitId[];
    prompts?: OptionalToolkitPrompts;
}): Promise<OptionalToolkitId[]>;
export interface OptionalToolkitInvocation {
    id: OptionalToolkitId;
    command: string;
    args: string[];
    cwd: string;
}
export declare function optionalToolkitInvocations(opts: {
    selected: OptionalToolkitId[];
    projectRoot: string;
    target: string;
    type: DocskitHarnessType;
    force?: boolean;
    useWsl?: boolean;
}): OptionalToolkitInvocation[];
export interface OptionalToolkitRunResult {
    initialized: OptionalToolkitId[];
    unavailable: OptionalToolkitId[];
}
/**
 * Run only explicitly selected, already-installed optional toolkits.
 * A missing executable is a non-fatal hint; Docskit never clones or installs
 * another toolkit implicitly. Other failures are surfaced because the member
 * explicitly requested that initialization.
 */
export declare function runOptionalToolkits(invocations: OptionalToolkitInvocation[]): OptionalToolkitRunResult;
