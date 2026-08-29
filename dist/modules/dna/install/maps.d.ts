import type { ProfileType } from '../config/project-root.js';
import { type OwnedGitignoreEntry } from './gitignore.js';
import { type EnsureLocalRepoMapsResult } from './local-maps.js';
export declare function assertPortableMap(file: string): void;
export interface SeededProjectMap {
    path: 'platform-repos.json' | 'platform-repos.example.json';
    sha256: string;
    created: boolean;
}
export declare function seedProjectMaps(opts: {
    root: string;
    type: ProfileType;
    repoName?: string;
    repoUrl?: string;
}): {
    written: string[];
    unchanged: string[];
    maps: SeededProjectMap[];
    /** Machine-local map ensure (both `.local.json`); shared ignore ownership. */
    localMaps: EnsureLocalRepoMapsResult;
    gitignoreAdded: boolean;
    gitignoreEntries: OwnedGitignoreEntry[];
};
