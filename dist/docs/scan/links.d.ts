import { type HubId } from './ids.js';
export type LinkHit = {
    file: string;
    href: string;
    ok: boolean;
    reason?: string;
};
export declare function validateMdLinks(docsRoot: string, files: string[]): LinkHit[];
export declare function depsFromFiles(files: string[], selfId: string): string[];
export declare function dependentsOf(id: string, index: Map<string, HubId>, docsRoot: string): string[];
