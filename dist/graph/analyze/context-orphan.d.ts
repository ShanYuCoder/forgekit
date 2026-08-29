/**
 * Context orphan = action data-scope mismatch (NOT "btn is named export/send").
 *
 * Screen displays hotel + rooms (+ other related visible on UI).
 * A button (export / send mail / anything) uses order / campaign / … data
 * that is NOT in that display set → warn member.
 */
import type { ContextOrphanFinding, Gap } from '../types.js';
export declare function contextOrphanSchemaBlock(): string;
export declare function parseContextOrphansDoc(doc: unknown): ContextOrphanFinding[];
export declare function scanModuleContextOrphans(repoRoot: string, moduleDir: string): ContextOrphanFinding[];
export declare function orphanToGap(f: ContextOrphanFinding): Gap;
