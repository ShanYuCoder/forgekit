import type { ProfileDefinition } from './manifest.js';
import type { ProfileType } from '../config/project-root.js';
export declare function declaredRole(root: string): string | undefined;
export declare function normalizeRole(role?: string): string | undefined;
export declare function declaredProfileType(root: string): ProfileType | undefined;
export declare function validateTarget(opts: {
    root: string;
    type: ProfileType;
    profile: ProfileDefinition;
    adapter?: string;
    feAdapter?: string;
    beAdapter?: string;
    force?: boolean;
}): void;
