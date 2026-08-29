import { type BeAdapterId, type FeAdapterId, type ProfileType } from '../config/project-root.js';
import type { ProfilesManifest } from '../profile/manifest.js';
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
}
export interface InitWizardSelection {
    targets: AgentId[];
    target: string;
    type: ProfileType;
    /** Single-lane convenience (fe or be only). */
    adapter?: string;
    feAdapter?: FeAdapterId;
    beAdapter?: BeAdapterId;
    wireCodegraph: boolean;
}
export declare function resolveInitWizard(opts: {
    root: string;
    manifest: ProfilesManifest;
    requestedTarget?: string;
    requestedType?: string;
    requestedAdapter?: string;
    requestedFeAdapter?: string;
    requestedBeAdapter?: string;
    wireCodegraphFlag?: boolean;
    codegraphCandidateKeys?: string[];
    interactive: boolean;
    detectedAgents?: AgentId[];
    prompts?: InitWizardPrompts;
}): Promise<InitWizardSelection>;
