import { createRequire } from 'module';
import path = require('path');

import tmrm = require('azure-pipelines-task-lib/mock-run');

import {
    TFS_CONNECTION_ID, PROJECT_ID, BUILD_ID,
    setTfsEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadExternalBuildArtifacts', 'download.js');
const tr = new tmrm.TaskMockRunner(taskPath);
const taskRequire = createRequire(taskPath);
const command = '##vso[task.setvariable variable=OUTPUT_TEST]destination-path-sentinel';
tr.setInput('connectionType', 'reposOrTfs');
tr.setInput('connection', TFS_CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', 'build-def-id');
tr.setInput('version', BUILD_ID);
tr.setInput('downloadPath', '/tmp/external-build-artifacts\r\n' + command);
setTfsEndpoint({ scheme: 'Token' });
registerAllMocks(tr, { artifacts: [] });
tr.registerMockExport('writeExternalOutput', taskRequire('azure-pipelines-task-lib/externaloutput').writeExternalOutput);
tr.run();
