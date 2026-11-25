import { createRequire } from 'module';
import fs = require('fs');
import path = require('path');

import tmrm = require('azure-pipelines-task-lib/mock-run');

import {
    TFS_CONNECTION_ID, PROJECT_ID, BUILD_ID, DOWNLOAD_PATH,
    setTfsEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadExternalBuildArtifacts', 'download.js');
const tr = new tmrm.TaskMockRunner(taskPath);
const data = '/some/share/##vso[task.setvariable variable=PATH_TEST]data-sentinel';
const name = '##vso[task.setvariable variable=NAME_TEST]name-sentinel';
tr.setInput('connectionType', 'reposOrTfs');
tr.setInput('connection', TFS_CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', 'build-def-id');
tr.setInput('version', BUILD_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);
setTfsEndpoint({ scheme: 'Token' });
registerAllMocks(tr, {
    artifacts: [{ type: 'filepath', data, name }]
});
if (process.env['EXTERNAL_TFS_TEST_ARTIFACT_PATH_EXISTS'] === 'true') {
    tr.registerMock('fs', { ...fs, existsSync: (p: fs.PathLike) => p === data + '/' + name || fs.existsSync(p) });
}

const taskRequire = createRequire(taskPath);
tr.registerMockExport('writeExternalOutput', taskRequire('azure-pipelines-task-lib/externaloutput').writeExternalOutput);
tr.run();
