import { z } from 'zod';
import { resolveProjectRoot } from '../config/project-root.js';
import { runEngine } from '../engines/run.js';
function text(data) {
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
const shape = {
    projectRoot: z.string().optional(),
    testsRoot: z.string().optional(),
    docsRoot: z.string().optional(),
    argv: z.array(z.string()).optional(),
};
export function registerTools(server) {
    const make = (engineRel, dryRun = false) => async (input) => {
        try {
            const argv = [...(input.argv ?? [])];
            if (dryRun && !argv.includes('--dry-run'))
                argv.push('--dry-run');
            const env = {};
            if (input.testsRoot)
                env.TESTKIT_TESTS_ROOT = input.testsRoot;
            if (input.docsRoot)
                env.TESTKIT_DOCS_ROOT = input.docsRoot;
            const result = runEngine({
                engineRel,
                projectRoot: resolveProjectRoot(input.projectRoot),
                argv,
                env,
            });
            return text({ ok: result.status === 0, ...result });
        }
        catch (error) {
            return text({ ok: false, error: error instanceof Error ? error.message : String(error) });
        }
    };
    server.tool('cases_render', 'Render plan YAML to Markdown on the tests hub.', shape, make(['cases', 'render-cases.mjs']));
    server.tool('cases_check_plans', 'Validate plan YAML structure.', shape, make(['cases', 'check-plans.mjs']));
    server.tool('cases_check_coverage', 'Check plan coverage gaps.', shape, make(['cases', 'check-coverage.mjs']));
    server.tool('testcase_gen', 'Generate Playwright tests on an FE repo from plan YAML.', shape, make(['testcase', 'runners', 'generate.mjs']));
    server.tool('testcase_gen_dry', 'Dry-run Playwright generation from plan YAML.', shape, make(['testcase', 'runners', 'generate.mjs'], true));
    server.tool('e2e_registry_validate', 'Validate FE e2e-test registry.', shape, make(['testcase', 'runners', 'validate-registry.mjs']));
}
//# sourceMappingURL=tools.js.map