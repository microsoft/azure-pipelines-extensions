// Shared helpers and path constants for ServiceNow extension tests.

import fs = require('fs');
import path = require('path');

export interface TaskManifest {
    id: string;
    name: string;
    runsOn: string[];
    visibility: string[];
    instanceNameFormat: string;
    version: { Major: number; Minor: number; Patch: number };
    inputs: {
        name: string;
        type: string;
        required?: boolean | string;
        defaultValue?: string;
        options?: Record<string, string>;
        visibleRule?: string;
        groupName?: string;
        helpMarkDown?: string;
    }[];
    groups?: { name: string; visibleRule?: string }[];
    dataSourceBindings?: { target: string; endpointId: string; dataSourceName: string }[];
    execution: {
        HttpRequestChain: {
            Execute: {
                RequestInputs: {
                    Method: string;
                    EndpointUrl: string;
                    Headers?: string;
                    Body?: string;
                    WaitForCompletion?: string;
                };
                ExecutionOptions?: { OutputVariables?: string; SkipSectionExpression?: string };
            }[];
        };
    };
}

export interface DataSource {
    name: string;
    endpointUrl: string;
    resultSelector?: string;
}

export interface AuthenticationScheme {
    type: string;
    authorizationUrl?: string;
    dataSourceBindings?: { dataSourceName: string }[];
}

export interface Contribution {
    type: string;
    properties: {
        name: string;
        authenticationSchemes?: AuthenticationScheme[];
        dataSources?: DataSource[];
    };
}

export interface ExtensionManifest {
    id: string;
    publisher: string;
    targets: { id: string }[];
    categories: string[];
    contributions?: Contribution[];
    icons?: Record<string, string>;
    files?: { path: string }[];
}

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

export function loadJson<T = TaskManifest>(filePath: string): T {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}
