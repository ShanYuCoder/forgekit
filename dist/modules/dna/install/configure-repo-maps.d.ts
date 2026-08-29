/**
 * Shared path + markers for `/configure-repo-maps` across toolkits.
 *
 * Platform DNA owns the SSOT skill. Docskit / Processkit ship thin copies for
 * install-order independence. Harness install must not leave DNA `init` aborted
 * when a thin copy is already present, and must not overwrite DNA SSOT with a
 * thin copy when DNA ran first.
 */
export declare const CONFIGURE_REPO_MAPS_REL = ".cursor/skills/configure-repo-maps/SKILL.md";
export declare function isDnaConfigureRepoMapsSsot(content: string): boolean;
export declare function isVendorThinConfigureRepoMaps(content: string): boolean;
