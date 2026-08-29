export declare const OPTIONAL_FALLBACK_SCHEMA_VERSION: "1.0.0";
export declare const OPTIONAL_FALLBACK_EVENT: "testkit.missing-optional";
export declare const TESTKIT_PACKAGE: "@platform/testkit";
export type OptionalFallbackReason = 'not-configured' | 'unavailable' | 'invocation-failed';
export type OptionalFallbackMode = 'local-deterministic-coverage' | 'local-deterministic-search';
export interface ReadMetrics {
    fileReads: number;
    contextBytes: number;
}
export interface MissingOptionalEvent {
    schemaVersion: typeof OPTIONAL_FALLBACK_SCHEMA_VERSION;
    event: typeof OPTIONAL_FALLBACK_EVENT;
    package: typeof TESTKIT_PACKAGE;
    runId: string;
    optional: string;
    reason: OptionalFallbackReason;
    fallback: OptionalFallbackMode;
    metrics: ReadMetrics;
}
export type MissingOptionalInput = Omit<MissingOptionalEvent, 'schemaVersion' | 'event' | 'package'>;
export declare function validateMissingOptionalEvent(value: unknown): {
    ok: boolean;
    errors: string[];
};
export declare class ReadMeasurement {
    #private;
    read(file: string): Buffer;
    readText(file: string): string;
    snapshot(): ReadMetrics;
}
export declare class MissingOptionalEventEmitter {
    #private;
    emit(input: MissingOptionalInput): MissingOptionalEvent | null;
}
