import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    ADO_CONNECTION_ID, PROJECT_ID, ADO_BUILD_ID, DOWNLOAD_PATH,
    setAdoEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadExternalBuildArtifacts', 'download.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'ado');
tr.setInput('azureDevOpsServiceConnection', ADO_CONNECTION_ID);
tr.setInput('projectAdo', PROJECT_ID);
tr.setInput('buildDefinitionAdo', 'ado-build-def-id');
tr.setInput('versionAdo', ADO_BUILD_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

setAdoEndpoint();

registerAllMocks(tr, {
    artifacts: [{ type: 'container', name: 'drop', data: '#/456/drop' }]
});

tr.run();
