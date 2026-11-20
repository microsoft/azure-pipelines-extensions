import fs = require('fs');
import { createRequire } from 'module';
import os = require('os');
import path = require('path');

import tmrm = require('azure-pipelines-task-lib/mock-run');

import {
    TFS_CONNECTION_ID, PROJECT_ID, REPOSITORY_ID, BRANCH_REGULAR, COMMIT_ID,
    setReposOrTfsEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsGit', 'downloadTfGit.js');
const tr = new tmrm.TaskMockRunner(taskPath);
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'external-tfs-git-output-'));
process.on('exit', () => fs.rmSync(tempDir, { recursive: true, force: true }));

tr.setInput('connectionType', 'reposOrTfs');
tr.setInput('connection', TFS_CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', REPOSITORY_ID);
tr.setInput('branch', BRANCH_REGULAR);
tr.setInput('version', COMMIT_ID);
tr.setInput('downloadPath', path.join(tempDir, 'repo'));
setReposOrTfsEndpoint({ scheme: 'Token' });

const command = '##vso[task.setvariable variable=OUTPUT_TEST]external-data-sentinel';
const outputChunks: Array<{ event: 'stdout' | 'stderr'; text: string }> = [
    { event: 'stdout', text: 'ordinary stdout\r' + command + '\n' + command },
    { event: 'stderr', text: 'ordinary stderr ' + command },
    { event: 'stderr', text: 'uppercase ' + command.replace('vso', 'VSO') },
    { event: 'stdout', text: 'format ##[warning]message' }
];
for (let i = 1; i < '##vso['.length; i++) {
    outputChunks.push({ event: 'stderr', text: command.slice(0, i) });
    outputChunks.push({ event: 'stderr', text: command.slice(i) });
}
registerAllMocks(tr, { gitWrapper: { outputChunks } });
// Exercise the task's dependency rather than the older repository-level task-lib mock.
const taskRequire = createRequire(taskPath);
tr.registerMockExport('writeExternalOutput', taskRequire('azure-pipelines-task-lib/externaloutput').writeExternalOutput);
tr.run();
