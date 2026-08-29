export declare function runEngine(opts: {
    engineRel: string[];
    projectRoot: string;
    argv?: string[];
    env?: Record<string, string>;
}): {
    status: number | null;
    stdout: string;
    stderr: string;
};
