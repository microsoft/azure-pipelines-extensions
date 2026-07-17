import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    TFS_CONNECTION_ID, PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH,
    COMMIT_ID,
    setReposOrTfsEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsGit', 'downloadTfGit.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Use the `refs/remotes/origin/pull/...` prefix variant of a PR ref so we
// exercise the second branch in isPullRequestBranch().
tr.setInput('connectionType', 'reposOrTfs');
tr.setInput('connection', TFS_CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', REPOSITORY_ID);
tr.setInput('branch', 'refs/remotes/origin/pull/99/merge');
tr.setInput('version', COMMIT_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

setReposOrTfsEndpoint({ scheme: 'Token' });

registerAllMocks(tr);

tr.run();
