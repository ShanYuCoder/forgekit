/**
 * Per-host harness generation profiles.
 *
 * init/installHarness renders harness/templates (or harness/cursor source)
 * into each selected agent's dir — not a blind copy/rename of Cursor assets.
 */
import { type AgentId } from './agents.js';
export interface AgentHarnessProfile {
    id: AgentId;
    label: string;
    /** Project-relative agent config dirs this profile writes into */
    dirs: string[];
    /** File-read tool name agents of this host should call */
    readTool: string;
    /** File-write tool name */
    writeTool: string;
    /**
     * Host workspace-rules file relative to each agent dir.
     * Sourced from template `AGENTS.md` but may land as CLAUDE.md etc.
     * `null` = do not emit a top-level overlay from AGENTS.md (Cursor uses .mdc).
     */
    overlayFile: string | null;
    /** Emit `rules/*.mdc` (Cursor-style alwaysApply). Others still get them as docs. */
    preferMdcRules: boolean;
}
export declare function agentHarnessProfile(id: AgentId): AgentHarnessProfile;
export declare function profilesForTargets(targets?: string[]): AgentHarnessProfile[];
/** Tokens substituted into harness templates at init time. */
export declare function renderHarnessTemplate(source: string, profile: AgentHarnessProfile, agentDir: string): string;
