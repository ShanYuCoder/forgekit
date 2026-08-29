import { z } from 'zod';
export declare const commonRegistrySchema: z.ZodObject<{
    version: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
    entries: z.ZodRecord<z.ZodString, z.ZodObject<{
        status: z.ZodEnum<{
            planned: "planned";
            implemented: "implemented";
            deprecated: "deprecated";
        }>;
        tag: z.ZodString;
        kind: z.ZodString;
        path: z.ZodString;
        symbol: z.ZodOptional<z.ZodString>;
        summary: z.ZodString;
        usedBy: z.ZodArray<z.ZodString>;
        specRefs: z.ZodArray<z.ZodString>;
        tests: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>;
    aliasIndex: z.ZodRecord<z.ZodString, z.ZodString>;
}, z.core.$loose>;
export interface CommonRegistryValidation {
    path: string;
    version: number;
    entries: number;
    aliases: number;
}
export declare function validateCommonRegistry(projectRoot: string, explicitPath?: string): CommonRegistryValidation;
