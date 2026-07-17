import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    TFS_CONNECTION_ID, PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH,
    BRANCH_REGULAR,
    setReposOrTfsEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsGit', 'downloadTfGit.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'reposOrTfs');
tr.setInput('connection', TFS_CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', REPOSITORY_ID);
tr.setInput('branch', BRANCH_REGULAR);
// version (commitId) deliberately not set
tr.setInput('downloadPath', DOWNLOAD_PATH);

setReposOrTfsEndpoint({ scheme: 'Token' });

registerAllMocks(tr);

tr.run();
