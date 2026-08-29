import { resolveBeAdapter, resolveFeAdapter, resolveType, } from '../config/project-root.js';
import { declaredProfileType } from '../profile/detect.js';
import { agentIds, agentNames, detectAgents, parseAgentTargets, } from './agents.js';
import { checkboxPrompt, selectPrompt, } from './prompt.js';
const laneChoices = [
    { value: 'docs', name: 'Docs' },
    { value: 'fe', name: 'Frontend / Client (FE)' },
    { value: 'be', name: 'Backend (BE)' },
    { value: 'monolith', name: 'Monolith (FE/Client + BE)' },
    { value: 'tests', name: 'Tests' },
];
const FE_ADAPTER_NAMES = {
    nuxt4: 'Nuxt 4',
    nextjs: 'Next.js',
    'dotnet-line': '.NET Line (WinForms)',
};
const BE_ADAPTER_NAMES = {
    fastapi: 'FastAPI',
    laravel: 'Laravel',
    'dotnet-integration': '.NET Integration',
};
export async function resolveInitWizard(opts) {
    const prompts = opts.prompts ?? {
        checkbox: checkboxPrompt,
        select: selectPrompt,
    };
    const detected = opts.detectedAgents ?? detectAgents(opts.root);
    const targets = opts.interactive && !opts.requestedTarget
        ? await prompts.checkbox({
            message: 'Which agents should receive toolkit setup?',
            choices: agentIds.map((id) => ({
                value: id,
                name: detected.includes(id) ? `${agentNames[id]} (detected)` : agentNames[id],
                checked: detected.length ? detected.includes(id) : id === 'cursor',
            })),
        })
        : parseAgentTargets(opts.requestedTarget, detected);
    const lockedType = declaredProfileType(opts.root);
    const type = opts.requestedType
        ? resolveType(opts.requestedType)
        : lockedType
            ? lockedType
            : opts.interactive
                ? await prompts.select({
                    message: 'Select the destination lane:',
                    choices: laneChoices,
                })
                : resolveType();
    const profile = opts.manifest.profiles[type];
    let feAdapter;
    let beAdapter;
    if (type === 'fe' || type === 'monolith') {
        const feList = type === 'fe' ? (profile.adapters ?? []) : (profile.feAdapters ?? []);
        const requested = opts.requestedFeAdapter ?? (type === 'fe' ? opts.requestedAdapter : undefined);
        if (requested) {
            feAdapter = resolveFeAdapter(requested);
        }
        else if (opts.interactive) {
            feAdapter = (await prompts.select({
                message: 'Select the FE/client adapter:',
                choices: feList.map((value) => ({
                    value,
                    name: FE_ADAPTER_NAMES[value] ?? value,
                })),
            }));
        }
        else if (type === 'fe') {
            feAdapter = resolveFeAdapter();
        }
        else {
            throw new Error('--fe-adapter is required for --type=monolith');
        }
    }
    if (type === 'be' || type === 'monolith') {
        const beList = type === 'be' ? (profile.adapters ?? []) : (profile.beAdapters ?? []);
        const requested = opts.requestedBeAdapter ?? (type === 'be' ? opts.requestedAdapter : undefined);
        if (requested) {
            beAdapter = resolveBeAdapter(requested);
        }
        else if (opts.interactive) {
            beAdapter = (await prompts.select({
                message: 'Select the BE adapter:',
                choices: beList.map((value) => ({
                    value,
                    name: BE_ADAPTER_NAMES[value] ?? value,
                })),
            }));
        }
        else if (type === 'be') {
            beAdapter = resolveBeAdapter();
        }
        else {
            throw new Error('--be-adapter is required for --type=monolith');
        }
    }
    const adapter = type === 'fe' ? feAdapter : type === 'be' ? beAdapter : undefined;
    const cursorSelected = targets.includes('cursor');
    const candidates = opts.codegraphCandidateKeys ?? [];
    let wireCodegraph = opts.wireCodegraphFlag ?? cursorSelected;
    if (opts.wireCodegraphFlag === undefined &&
        opts.interactive &&
        cursorSelected &&
        candidates.length) {
        const choice = await prompts.select({
            message: `Wire cross-repo CodeGraph servers for ${candidates.length} repo(s) now?`,
            choices: [
                { value: 'yes', name: 'Yes — wire into .cursor/mcp.json now' },
                { value: 'later', name: 'Skip — run `platform-dna codegraph:wire` later' },
            ],
        });
        wireCodegraph = choice === 'yes';
    }
    return {
        targets,
        target: targets.join(',') || 'none',
        type,
        adapter,
        feAdapter,
        beAdapter,
        wireCodegraph: wireCodegraph && cursorSelected,
    };
}
//# sourceMappingURL=init-wizard.js.map