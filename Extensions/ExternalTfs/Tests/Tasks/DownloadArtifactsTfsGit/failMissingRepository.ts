import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    TFS_CONNECTION_ID, PROJECT_ID, DOWNLOAD_PATH,
    BRANCH_REGULAR, COMMIT_ID,
    setReposOrTfsEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsGit', 'downloadTfGit.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'reposOrTfs');
tr.setInput('connection', TFS_CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
// repository (definition) deliberately not set -> validateInputs should throw.
tr.setInput('branch', BRANCH_REGULAR);
tr.setInput('version', COMMIT_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

setReposOrTfsEndpoint({ scheme: 'Token' });

registerAllMocks(tr);

tr.run();
