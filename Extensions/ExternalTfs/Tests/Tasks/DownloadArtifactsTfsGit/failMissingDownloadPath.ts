import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    TFS_CONNECTION_ID, PROJECT_ID, REPOSITORY_ID,
    BRANCH_REGULAR, COMMIT_ID,
    setReposOrTfsEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsGit', 'downloadTfGit.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'reposOrTfs');
tr.setInput('connection', TFS_CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', REPOSITORY_ID);
tr.setInput('branch', BRANCH_REGULAR);
tr.setInput('version', COMMIT_ID);
// downloadPath deliberately not set

setReposOrTfsEndpoint({ scheme: 'Token' });

registerAllMocks(tr);

tr.run();
