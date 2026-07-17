import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    TFS_CONNECTION_ID, PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH,
    BRANCH_REGULAR, COMMIT_ID,
    setReposOrTfsEndpoint, registerAllMocks, compressSetTimeout
} from './mockHelpers';

// Compress the 4-second retry backoff into ~5ms so the test stays fast even
// though it exercises the real executeWithRetries() path in downloadTfGit.js.
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

// First clone fails, second succeeds -> exercises retry path without exhausting attempts.
registerAllMocks(tr, { gitWrapper: { cloneFailures: 1 } });

tr.run();
