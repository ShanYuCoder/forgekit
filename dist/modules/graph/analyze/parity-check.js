/**
 * Cross-surface parity: create≠edit validation, register≠change-password,
 * FE≠BE empty policy (null / '' / [] / omit), type drift.
 *
 * Local-first: ingest structured findings (from IR scan or cloud same-turn),
 * emit GapKind parity-drift + askUser for member — never cloud for the confirm.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { contextOrphanSchemaBlock, orphanToGap, parseContextOrphansDoc, scanModuleContextOrphans, } from './context-orphan.js';
const SURFACE_HINTS = [
    { re: /create|store|new|register|signup/i, surface: 'create' },
    { re: /edit|update|modify/i, surface: 'edit' },
    { re: /change[-_]?pass|password[-_]?change|reset[-_]?pass/i, surface: 'change-password' },
    { re: /login|signin/i, surface: 'login' },
    { re: /list|index|search/i, surface: 'list' },
];
/** Compact schema block — append to cloudPromptSlice on /legacy-spec (1 turn). */
export function parityCloudSchemaBlock() {
    return [
        '## parityFindings (REQUIRED same turn — do not defer to grill)',
        'Return YAML/JSON array. Local MCP will ask member A/B/C; do not ask in prose.',
        'Each item: id, field, surfaces[], observed[{surface, required?, type?, empty?, rules?}],',
        '  severity?: info|warn|error, options?: [{choice:A|B|C, label, canon?}]',
        'empty enum: null | empty-string | omit | empty-array | unknown',
        'Cover: create↔edit validate, register↔change-password, FE↔BE, null/\'\'/[]/omit.',
        'Skip fields identical on all surfaces. Prefer machine fields over prose.',
        '',
        contextOrphanSchemaBlock(),
    ].join('\n');
}
export function parityCheck(input) {
    const findings = collectFindings(input);
    const orphans = collectOrphans(input);
    const remembered = rememberedParityIds(input.store);
    // Field/rule drift: must confirm A/B/C (skip if already remembered)
    const active = findings.filter((f) => !remembered.has(f.id) && !remembered.has(fieldKey(f.field)));
    const gaps = [];
    const askUser = [];
    for (const f of active) {
        const drift = describeDrift(f);
        if (!drift)
            continue;
        const severity = f.severity ?? inferSeverity(f);
        gaps.push({
            kind: 'parity-drift',
            id: f.id,
            message: drift,
            source: f.observed.map((o) => o.source).filter(Boolean).join('; ') || input.moduleDir,
            severity,
            confidence: 0.9,
        });
        askUser.push(f.askUser ?? buildAskUser(f));
    }
    // Context-orphan: warn only — never askUser / never gate
    for (const o of orphans) {
        gaps.push(orphanToGap(o));
    }
    const cloudPromptSlice = [
        '## artifactgraph parity (confirm) + context-orphan (warn only)',
        ...gaps
            .filter((g) => g.kind === 'parity-drift')
            .map((g) => `- [CONFIRM ${g.severity}] ${g.id}: ${g.message}`),
        ...gaps
            .filter((g) => g.kind === 'context-orphan')
            .map((g) => `- [WARN only] ${g.id}: ${g.message}`),
        gaps.length ? '' : '(no open parity-drift / context-orphan)',
        '',
        parityCloudSchemaBlock(),
    ].join('\n');
    const result = {
        projectId: input.projectId,
        repoRoot: input.repoRoot,
        tags: [],
        draftTags: [],
        gaps,
        askUser,
        cloudPromptSlice,
    };
    input.store?.saveGapSnapshot(input.findingsPath ?? input.moduleDir, gaps);
    return result;
}
/** Persist member parity choice (subject = finding id or field:name). */
export function recordParityDecision(store, subject, choice, payload = {}) {
    store.rememberDecision('parity-confirm', subject, { choice, ...payload });
}
function collectFindings(input) {
    const out = [];
    if (input.findingsJson?.trim()) {
        out.push(...parseFindingsDoc(JSON.parse(input.findingsJson)));
    }
    if (input.findingsPath) {
        out.push(...loadFindingsFile(input.repoRoot, input.findingsPath));
    }
    if (input.moduleDir) {
        out.push(...scanModuleParity(input.repoRoot, input.moduleDir));
    }
    return mergeById(out);
}
function collectOrphans(input) {
    const out = [];
    if (input.findingsJson?.trim()) {
        out.push(...parseContextOrphansDoc(JSON.parse(input.findingsJson)));
    }
    if (input.findingsPath) {
        out.push(...loadOrphansFile(input.repoRoot, input.findingsPath));
    }
    if (input.moduleDir) {
        out.push(...scanModuleContextOrphans(input.repoRoot, input.moduleDir));
    }
    return mergeOrphansById(out);
}
function loadOrphansFile(repoRoot, rel) {
    const candidates = [
        path.isAbsolute(rel) ? rel : path.join(repoRoot, rel),
        path.isAbsolute(rel) ? '' : path.resolve(process.cwd(), rel),
    ].filter(Boolean);
    const abs = candidates.find((p) => existsSync(p));
    if (!abs)
        return [];
    const raw = readFileSync(abs, 'utf8');
    const doc = abs.endsWith('.json') ? JSON.parse(raw) : parseYaml(raw);
    return parseContextOrphansDoc(doc);
}
function mergeOrphansById(list) {
    const map = new Map();
    for (const o of list)
        map.set(o.id, o);
    return [...map.values()];
}
function loadFindingsFile(repoRoot, rel) {
    const candidates = [
        path.isAbsolute(rel) ? rel : path.join(repoRoot, rel),
        path.isAbsolute(rel) ? '' : path.resolve(process.cwd(), rel),
    ].filter(Boolean);
    const abs = candidates.find((p) => existsSync(p));
    if (!abs)
        throw new Error(`parity findings not found: ${candidates[0]}`);
    const raw = readFileSync(abs, 'utf8');
    const doc = abs.endsWith('.json') ? JSON.parse(raw) : parseYaml(raw);
    return parseFindingsDoc(doc);
}
function parseFindingsDoc(doc) {
    if (!doc || typeof doc !== 'object')
        return [];
    const root = doc;
    const list = Array.isArray(doc)
        ? doc
        : Array.isArray(root.parityFindings)
            ? root.parityFindings
            : Array.isArray(root.findings)
                ? root.findings
                : [];
    return list.map((item, i) => normalizeFinding(item, i)).filter(Boolean);
}
function normalizeFinding(raw, index) {
    if (!raw || typeof raw !== 'object')
        return null;
    const o = raw;
    const field = String(o.field ?? o.name ?? '').trim();
    if (!field)
        return null;
    const observed = normalizeObserved(o.observed);
    const surfaces = Array.isArray(o.surfaces) && o.surfaces.length
        ? o.surfaces.map(String)
        : [...new Set(observed.map((x) => x.surface))];
    if (surfaces.length < 2 && observed.length < 2)
        return null;
    return {
        id: String(o.id ?? `${fieldKey(field)}.${index}`),
        field,
        surfaces,
        observed,
        severity: asSeverity(o.severity),
        options: Array.isArray(o.options) ? o.options : undefined,
        askUser: typeof o.askUser === 'string' ? o.askUser : undefined,
    };
}
function normalizeObserved(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .map((item) => {
        if (!item || typeof item !== 'object')
            return null;
        const o = item;
        const surface = String(o.surface ?? '').trim();
        if (!surface)
            return null;
        return {
            surface,
            required: typeof o.required === 'boolean' ? o.required : undefined,
            type: o.type != null ? String(o.type) : undefined,
            empty: 'empty' in o ? asEmpty(o.empty) : undefined,
            rules: isPlain(o.rules) ? o.rules : undefined,
            source: o.source != null ? String(o.source) : undefined,
        };
    })
        .filter(Boolean);
}
/** Scan bundles under moduleDir — diff legacy.fields across surfaces. */
function scanModuleParity(repoRoot, moduleDir) {
    const abs = path.isAbsolute(moduleDir) ? moduleDir : path.join(repoRoot, moduleDir);
    if (!existsSync(abs))
        throw new Error(`moduleDir not found: ${abs}`);
    const observations = [];
    for (const file of listYamlFiles(abs)) {
        const doc = parseYaml(readFileSync(file, 'utf8'));
        const surface = inferSurface(file, doc);
        const fields = extractFields(doc);
        for (const f of fields) {
            observations.push({
                field: f.name,
                surface: f.surface ?? surface,
                required: f.required,
                type: f.type,
                empty: f.empty,
                rules: f.rules,
                source: file,
            });
        }
    }
    return groupToFindings(observations);
}
function extractFields(doc) {
    const buckets = [];
    const legacy = doc.legacy;
    if (Array.isArray(legacy?.fields))
        buckets.push(...legacy.fields);
    if (Array.isArray(doc.fields))
        buckets.push(...doc.fields);
    const spec = doc.spec;
    const ui = spec?.ui;
    if (Array.isArray(ui?.fields))
        buckets.push(...ui.fields);
    const out = [];
    for (const raw of buckets) {
        if (!raw || typeof raw !== 'object')
            continue;
        const o = raw;
        const name = String(o.name ?? o.key ?? o.field ?? '').trim();
        if (!name)
            continue;
        const validation = isPlain(o.validation) ? o.validation : undefined;
        const rules = isPlain(o.rules)
            ? o.rules
            : validation;
        out.push({
            name,
            surface: o.surface != null ? String(o.surface) : undefined,
            required: typeof o.required === 'boolean'
                ? o.required
                : typeof validation?.required === 'boolean'
                    ? validation.required
                    : undefined,
            type: o.type != null ? String(o.type) : undefined,
            empty: 'empty' in o || 'emptyPolicy' in o ? asEmpty(o.empty ?? o.emptyPolicy) : undefined,
            rules,
        });
    }
    return out;
}
function groupToFindings(rows) {
    const byField = new Map();
    for (const r of rows) {
        const k = fieldKey(r.field);
        const list = byField.get(k) ?? [];
        list.push(r);
        byField.set(k, list);
    }
    const findings = [];
    for (const [fk, list] of byField) {
        const surfaces = [...new Set(list.map((x) => x.surface))];
        if (surfaces.length < 2)
            continue;
        const fps = new Set(list.map((x) => fingerprint(x)));
        if (fps.size < 2)
            continue;
        findings.push({
            id: `${fk}.parity`,
            field: list[0].field,
            surfaces,
            observed: list.map(({ field: _f, ...obs }) => obs),
            severity: 'warn',
        });
    }
    return findings;
}
function fingerprint(o) {
    const rules = o.rules ? JSON.stringify(sortKeys(o.rules)) : '';
    return [
        o.required === undefined ? '?' : o.required ? 'req' : 'opt',
        o.type ?? '?',
        o.empty ?? '?',
        rules,
    ].join('|');
}
function describeDrift(f) {
    if (f.observed.length < 2)
        return null;
    const parts = f.observed.map((o) => `${o.surface}:{${fingerprint(o)}}`);
    const unique = new Set(parts);
    if (unique.size < 2)
        return null;
    return `Field "${f.field}" drifts across ${f.surfaces.join(',')}: ${[...unique].join(' vs ')}`;
}
function buildAskUser(f) {
    if (f.options?.length) {
        return `[PARITY] ${f.id} (${f.field}): ${f.options.map((o) => `${o.choice}) ${o.label}`).join('  ')}`;
    }
    const empties = [...new Set(f.observed.map((o) => o.empty).filter(Boolean))];
    if (empties.length > 1) {
        return `[PARITY] ${f.id} empty policy for "${f.field}": A) null  B) empty-string  C) omit (defer=keep note)`;
    }
    return `[PARITY] ${f.id} "${f.field}" create/edit/API rules differ — A) pick stricter canon  B) keep drift + openQuestion  C) defer`;
}
function inferSeverity(f) {
    const hasEmptyDrift = new Set(f.observed.map((o) => o.empty).filter(Boolean)).size > 1;
    const hasTypeDrift = new Set(f.observed.map((o) => o.type).filter(Boolean)).size > 1;
    if (hasEmptyDrift || hasTypeDrift)
        return 'error';
    return 'warn';
}
function inferSurface(file, doc) {
    const id = String(doc.id ?? path.basename(path.dirname(file)));
    for (const h of SURFACE_HINTS) {
        if (h.re.test(id) || h.re.test(file))
            return h.surface;
    }
    const profile = doc.gen?.codegen;
    if (profile?.profile)
        return String(profile.profile);
    return id;
}
function listYamlFiles(dir) {
    const out = [];
    const walk = (d, depth) => {
        if (depth > 6)
            return;
        for (const name of readdirSync(d)) {
            if (name.startsWith('.') || name === 'node_modules' || name === 'md')
                continue;
            const p = path.join(d, name);
            const st = statSync(p);
            if (st.isDirectory())
                walk(p, depth + 1);
            else if (/\.(ya?ml)$/i.test(name) && !name.includes('test.yaml'))
                out.push(p);
        }
    };
    walk(dir, 0);
    return out;
}
function rememberedParityIds(store) {
    if (!store)
        return new Set();
    return new Set(store.findDecisionsByKind('parity-confirm').map((d) => d.subject));
}
function mergeById(list) {
    const map = new Map();
    for (const f of list) {
        const prev = map.get(f.id);
        if (!prev) {
            map.set(f.id, f);
            continue;
        }
        map.set(f.id, {
            ...prev,
            ...f,
            observed: [...prev.observed, ...f.observed],
            surfaces: [...new Set([...prev.surfaces, ...f.surfaces])],
        });
    }
    return [...map.values()];
}
function fieldKey(name) {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.');
}
function asEmpty(v) {
    if (v === undefined)
        return undefined;
    if (v === null)
        return 'null';
    const s = String(v);
    if (['null', 'empty-string', 'omit', 'empty-array', 'unknown'].includes(s)) {
        return s;
    }
    if (s === "''" || s === '""' || s === '')
        return 'empty-string';
    if (s === '[]')
        return 'empty-array';
    return 'unknown';
}
function asSeverity(v) {
    if (v === 'info' || v === 'warn' || v === 'error')
        return v;
    return undefined;
}
function isPlain(v) {
    return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}
function sortKeys(obj) {
    return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
}
//# sourceMappingURL=parity-check.js.map