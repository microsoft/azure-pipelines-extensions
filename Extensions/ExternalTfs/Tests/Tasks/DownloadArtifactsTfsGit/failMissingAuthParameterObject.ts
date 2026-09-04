import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    TFS_CONNECTION_ID, PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH,
    BRANCH_REGULAR, COMMIT_ID,
    registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsGit', 'downloadTfGit.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'reposOrTfs');
tr.setInput('connection', TFS_CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', REPOSITORY_ID);
tr.setInput('branch', BRANCH_REGULAR);
tr.setInput('version', COMMIT_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

process.env['ENDPOINT_URL_' + TFS_CONNECTION_ID] = 'https://tfs.example.local/DefaultCollection';
process.env['ENDPOINT_AUTH_' + TFS_CONNECTION_ID] = JSON.stringify({
    scheme: 'UsernamePassword'
});
process.env['ENDPOINT_AUTH_SCHEME_' + TFS_CONNECTION_ID] = 'UsernamePassword';

registerAllMocks(tr);

tr.run();
