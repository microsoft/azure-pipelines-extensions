import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    CONNECTION_ID, PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH, CHANGESET_ID,
    setEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsVersionControl', 'downloadTfsVersionControl.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connection', CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', REPOSITORY_ID);
tr.setInput('version', CHANGESET_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

setEndpoint({ scheme: 'Token' });

// get (sync) rejects -> the task should call tl.error("Failed to sync workspace. ...")
// and process.exit(1).
registerAllMocks(tr, { tfvcWrapper: { getFails: true } });

tr.run();
