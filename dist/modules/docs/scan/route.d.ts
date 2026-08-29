/** Topic → arc42 chapter + skill (architecture-core / C4-SKILL-MCP-NOTES). */
export type RouteHit = {
    chapter: string;
    path: string;
    skill: string;
    note?: string;
};
export declare function routeTopic(topic: string): RouteHit[];
