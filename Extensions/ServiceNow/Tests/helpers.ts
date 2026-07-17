// Shared helpers and path constants for ServiceNow extension tests.

import path = require('path');
import fs = require('fs');

// Anchor repoRoot by walking up from __dirname until we find the 'Extensions' directory.
// This avoids hard-coding depth relative to _build output layout.
function findRepoRoot(startDir: string): string {
    let dir = startDir;
    while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, 'Extensions')) && fs.existsSync(path.join(dir, 'scripts'))) {
            return dir;
        }
        dir = path.dirname(dir);
    }
    throw new Error(`Could not find repo root (containing Extensions/ and scripts/) from ${startDir}`);
}

export const repoRoot = findRepoRoot(__dirname);
export const srcRoot = path.join(repoRoot, 'Extensions', 'ServiceNow', 'Src');
export const extensionManifestPath = path.join(srcRoot, 'vss-extension.json');

export const createTaskV0Path = path.join(srcRoot, 'Tasks', 'CreateAndQueryChangeRequest', 'CreateAndQueryChangeRequestV0', 'task.json');
export const createTaskV1Path = path.join(srcRoot, 'Tasks', 'CreateAndQueryChangeRequest', 'CreateAndQueryChangeRequestV1', 'task.json');
export const createTaskV2Path = path.join(srcRoot, 'Tasks', 'CreateAndQueryChangeRequest', 'CreateAndQueryChangeRequestV2', 'task.json');

export const updateTaskV0Path = path.join(srcRoot, 'Tasks', 'UpdateChangeRequest', 'UpdateChangeRequestV0', 'task.json');
export const updateTaskV1Path = path.join(srcRoot, 'Tasks', 'UpdateChangeRequest', 'UpdateChangeRequestV1', 'task.json');
export const updateTaskV2Path = path.join(srcRoot, 'Tasks', 'UpdateChangeRequest', 'UpdateChangeRequestV2', 'task.json');

export const scriptsRoot = path.join(repoRoot, 'scripts');
export const determineCiScriptPath = path.join(scriptsRoot, 'DetermineCiTestPipelineName.ps1');
export const triggerCiScriptPath = path.join(scriptsRoot, 'TriggerCiTestsForExtensions.ps1');

export function loadJson(filePath: string): any {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}
