import { type ProfileType } from '../config/project-root.js';
export interface ProfileDefinition {
    repoMarkers: string[];
    requiresAdapter?: boolean;
    /** Single-lane adapters (fe or be). */
    adapters?: string[];
    /** Monolith FE adapter list. */
    feAdapters?: string[];
    /** Monolith BE adapter list. */
    beAdapters?: string[];
    ownedSkills?: string[];
}
export interface ProfilesManifest {
    schemaVersion: 1;
    profiles: Record<ProfileType, ProfileDefinition>;
}
export declare function loadProfiles(): ProfilesManifest;
