/**
 * Spawn only allowlisted commands from artifactgraph.json.
 *
 * Security / token goal:
 * - Agent must NOT invent shell commands
 * - MCP substitutes {spec} etc., rejects legacy external paths, then runs fixed argv
 */
import type { ArtifactgraphConfig } from '../types.js';
export interface RunCommandResult {
    commandKey: string;
    argv: string[];
    cwd: string;
    exitCode: number | null;
    stdout: string;
    stderr: string;
}
export interface InspectCommandResult {
    ok: boolean;
    commandKey: string;
    allowlisted: boolean;
    knownKeys: string[];
    argv?: string[];
    cwd: string;
    executableOwner: 'product-repo' | 'codegenkit' | 'testkit' | 'docskit' | 'unknown';
    recommendation: string;
}
/**
 * Inspect/materialize one product-owned allowlisted command without executing it.
 * ArtifactGraph recommends; the owning kit/product runner executes.
 */
export declare function inspectAllowlistedCommand(repoRoot: string, cfg: ArtifactgraphConfig, commandKey: string, vars?: Record<string, string>): InspectCommandResult;
/**
 * Replace `{spec}` (and future placeholders) in the argv template.
 */
export declare function materializeArgv(template: string[], vars: Record<string, string>): string[];
/**
 * Run one named command from config.commands.
 * @throws if commandKey is not in the allowlist
 */
export declare function runAllowlistedCommand(repoRoot: string, cfg: ArtifactgraphConfig, commandKey: string, vars?: Record<string, string>): RunCommandResult;
