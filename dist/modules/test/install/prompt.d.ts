export interface CheckboxChoice<T extends string> {
    value: T;
    name: string;
    checked?: boolean;
}
/** Zero-dependency multi-select TTY prompt. */
export declare function checkboxPrompt<T extends string>(opts: {
    message: string;
    choices: Array<CheckboxChoice<T>>;
}): Promise<T[]>;
/** Zero-dependency single-select TTY prompt. */
export declare function selectPrompt<T extends string>(opts: {
    message: string;
    choices: Array<{
        value: T;
        name: string;
    }>;
    defaultIndex?: number;
}): Promise<T>;
