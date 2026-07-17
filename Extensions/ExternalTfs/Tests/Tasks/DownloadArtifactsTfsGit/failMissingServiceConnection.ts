import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH,
    BRANCH_REGULAR, COMMIT_ID,
    registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsGit', 'downloadTfGit.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'reposOrTfs');
// service connection deliberately empty -> validateInputs should throw synchronously.
tr.setInput('connection', '   ');
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', REPOSITORY_ID);
tr.setInput('branch', BRANCH_REGULAR);
tr.setInput('version', COMMIT_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

registerAllMocks(tr);

tr.run();
