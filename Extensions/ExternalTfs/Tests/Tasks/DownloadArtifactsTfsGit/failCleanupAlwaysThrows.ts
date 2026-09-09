import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    TFS_CONNECTION_ID, PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH,
    BRANCH_REGULAR, COMMIT_ID,
    setReposOrTfsEndpoint, registerAllMocks, registerFsMock, compressSetTimeout
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

setReposOrTfsEndpoint({ scheme: 'Token' });

// removeDownloadPath()'s fs.rmSync() throws synchronously on every call, so
// git.clone() is never reached. With GIT_CLONE_RETRY_ATTEMPTS=4 the task
// should still make 5 cleanup attempts (1 initial + 4 retries) before
// surfacing "OperationFailed: gitClone" and failing - proving the synchronous
// throw is consumed by the retry loop instead of skipping it.
registerFsMock(tr, { rmSyncAlwaysFails: true });
registerAllMocks(tr);

tr.run();
