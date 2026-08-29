/**
 * Zero-dep TTY prompts — ↑↓ + Space + Enter.
 */
export interface CheckboxChoice<T extends string = string> {
    value: T;
    name: string;
    checked?: boolean;
}
/**
 * Multi-select: ↑/↓ move · Space toggle · a all · Enter confirm · Ctrl+C abort.
 */
export declare function checkboxPrompt<T extends string>(opts: {
    message: string;
    choices: CheckboxChoice<T>[];
}): Promise<T[]>;
/**
 * Single-select: ↑/↓ · Enter.
 */
export declare function selectPrompt<T extends string>(opts: {
    message: string;
    choices: Array<{
        value: T;
        name: string;
    }>;
    defaultIndex?: number;
}): Promise<T>;
/** Fallback line prompt when needed. */
export declare function promptLine(question: string): Promise<string>;
