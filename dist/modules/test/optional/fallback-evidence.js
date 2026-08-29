import { readFileSync } from 'node:fs';
export const OPTIONAL_FALLBACK_SCHEMA_VERSION = '1.0.0';
export const OPTIONAL_FALLBACK_EVENT = 'testkit.missing-optional';
export const TESTKIT_PACKAGE = '@platform/testkit';
function isNonNegativeInteger(value) {
    return Number.isInteger(value) && Number(value) >= 0;
}
export function validateMissingOptionalEvent(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { ok: false, errors: ['event must be an object'] };
    }
    const event = value;
    const errors = [];
    const allowed = new Set([
        'schemaVersion',
        'event',
        'package',
        'runId',
        'optional',
        'reason',
        'fallback',
        'metrics',
    ]);
    for (const key of Object.keys(event)) {
        if (!allowed.has(key))
            errors.push(`unexpected field: ${key}`);
    }
    if (event.schemaVersion !== OPTIONAL_FALLBACK_SCHEMA_VERSION) {
        errors.push(`schemaVersion must be ${OPTIONAL_FALLBACK_SCHEMA_VERSION}`);
    }
    if (event.event !== OPTIONAL_FALLBACK_EVENT) {
        errors.push(`event must be ${OPTIONAL_FALLBACK_EVENT}`);
    }
    if (event.package !== TESTKIT_PACKAGE) {
        errors.push(`package must be ${TESTKIT_PACKAGE}`);
    }
    if (typeof event.runId !== 'string' || event.runId.length === 0) {
        errors.push('runId must be a non-empty string');
    }
    if (typeof event.optional !== 'string' || event.optional.length === 0) {
        errors.push('optional must be a non-empty string');
    }
    if (!['not-configured', 'unavailable', 'invocation-failed'].includes(String(event.reason))) {
        errors.push('reason is invalid');
    }
    if (!['local-deterministic-coverage', 'local-deterministic-search'].includes(String(event.fallback))) {
        errors.push('fallback is invalid');
    }
    if (typeof event.metrics !== 'object' || event.metrics === null || Array.isArray(event.metrics)) {
        errors.push('metrics must be an object');
    }
    else {
        const metrics = event.metrics;
        if (!isNonNegativeInteger(metrics.fileReads)) {
            errors.push('metrics.fileReads must be a non-negative integer');
        }
        if (!isNonNegativeInteger(metrics.contextBytes)) {
            errors.push('metrics.contextBytes must be a non-negative integer');
        }
        for (const key of Object.keys(metrics)) {
            if (!['fileReads', 'contextBytes'].includes(key)) {
                errors.push(`unexpected metrics field: ${key}`);
            }
        }
    }
    return { ok: errors.length === 0, errors };
}
export class ReadMeasurement {
    #metrics = { fileReads: 0, contextBytes: 0 };
    read(file) {
        const content = readFileSync(file);
        this.#metrics.fileReads += 1;
        this.#metrics.contextBytes += content.byteLength;
        return content;
    }
    readText(file) {
        return this.read(file).toString('utf8');
    }
    snapshot() {
        return { ...this.#metrics };
    }
}
export class MissingOptionalEventEmitter {
    #emitted = new Set();
    emit(input) {
        const key = `${input.runId}\0${input.optional}`;
        if (this.#emitted.has(key))
            return null;
        const event = {
            schemaVersion: OPTIONAL_FALLBACK_SCHEMA_VERSION,
            event: OPTIONAL_FALLBACK_EVENT,
            package: TESTKIT_PACKAGE,
            ...input,
            metrics: { ...input.metrics },
        };
        const result = validateMissingOptionalEvent(event);
        if (!result.ok)
            throw new Error(`Invalid missing-optional event: ${result.errors.join('; ')}`);
        this.#emitted.add(key);
        return event;
    }
}
//# sourceMappingURL=fallback-evidence.js.map