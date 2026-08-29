import { readFileSync } from 'node:fs';
import path from 'node:path';
import { packageRoot } from '../config/project-root.js';
export function loadProfiles() {
    const manifest = JSON.parse(readFileSync(path.join(packageRoot(), 'profiles.json'), 'utf8'));
    if (manifest.schemaVersion !== 1)
        throw new Error('Unsupported profiles.json schemaVersion');
    return manifest;
}
//# sourceMappingURL=manifest.js.map