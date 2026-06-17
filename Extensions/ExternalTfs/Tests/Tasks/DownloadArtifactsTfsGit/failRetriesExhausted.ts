import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    TFS_CONNECTION_ID, PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH,
    BRANCH_REGULAR, COMMIT_ID,
    setReposOrTfsEndpoint, registerAllMocks, compressSetTimeout
} from './mockHelpers';

// Compress the 4-second retry backoff into ~5ms so the test stays fast.
compressSetTimeout();

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsGit', 'downloadTfGit.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'reposOrTfs');
tr.setInput('connection', TFS_CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', REPOSITORY_ID);
tr.setInput('branch', BRANCH_REGULAR);
tr.setInput('version', COMMIT_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

process.env['SYSTEM_DEBUG'] = 'true';

setReposOrTfsEndpoint({ scheme: 'Token' });

// Force every clone attempt to fail. With GIT_CLONE_RETRY_ATTEMPTS=4 the task
// should make a total of 5 attempts (1 initial + 4 retries) and then surface
// "OperationFailed: gitClone" before failing.
registerAllMocks(tr, { gitWrapper: { cloneAlwaysFails: true } });

tr.run();
