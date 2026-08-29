import { type BeAdapterId, type CodegenType, type FeAdapterId } from '../config/project-root.js';
import { type AgentId } from './agents.js';
import { type CheckboxChoice } from './prompt.js';
export interface InitWizardPrompts {
    checkbox<T extends string>(opts: {
        message: string;
        choices: CheckboxChoice<T>[];
    }): Promise<T[]>;
    select<T extends string>(opts: {
        message: string;
        choices: Array<{
            value: T;
            name: string;
        }>;
        defaultIndex?: number;
    }): Promise<T>;
    line(question: string): Promise<string>;
}
export interface InitWizardSelection {
    targets: AgentId[];
    target: string;
    type: CodegenType;
    feAdapter?: FeAdapterId;
    beAdapter?: BeAdapterId;
    docsRoot?: string;
    /** Optional toolkits chosen now (empty = init "trống" for optionals). */
    withOptional: string[];
    /** Whether to delegate CodeGraph wire to Platform DNA during this init. */
    wireCodegraph: boolean;
}
export declare function resolveInitWizard(opts: {
    root: string;
    requestedTarget?: string;
    requestedType?: string;
    requestedAdapter?: string;
    requestedFeAdapter?: string;
    requestedBeAdapter?: string;
    requestedDocsRoot?: string;
    /** Optional toolkits from `--with`; undefined means "not passed" (prompt). */
    requestedWith?: string[];
    /** Explicit `--codegraph` / `--no-codegraph`; undefined defers to the wizard. */
    wireCodegraphFlag?: boolean;
    interactive: boolean;
    detectedAgents?: AgentId[];
    prompts?: InitWizardPrompts;
}): Promise<InitWizardSelection>;
