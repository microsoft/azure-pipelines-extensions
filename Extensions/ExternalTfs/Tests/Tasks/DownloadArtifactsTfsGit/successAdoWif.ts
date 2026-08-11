import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    ADO_CONNECTION_ID, PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH,
    BRANCH_REGULAR, COMMIT_ID,
    setAdoEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsGit', 'downloadTfGit.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'ado');
tr.setInput('azureDevOpsServiceConnection', ADO_CONNECTION_ID);
tr.setInput('projectAdo', PROJECT_ID);
tr.setInput('definitionAdo', REPOSITORY_ID);
tr.setInput('branchAdo', BRANCH_REGULAR);
tr.setInput('versionAdo', COMMIT_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

setAdoEndpoint('WorkloadIdentityFederation');

registerAllMocks(tr);

tr.run();
