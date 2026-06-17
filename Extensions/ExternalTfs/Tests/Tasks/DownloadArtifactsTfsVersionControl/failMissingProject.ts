import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    CONNECTION_ID, REPOSITORY_ID, DOWNLOAD_PATH, CHANGESET_ID,
    setEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsVersionControl', 'downloadTfsVersionControl.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connection', CONNECTION_ID);
// project deliberately not set; tl.getInput("project", true) should emit "Input required: project".
tr.setInput('definition', REPOSITORY_ID);
tr.setInput('version', CHANGESET_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

setEndpoint({ scheme: 'Token' });

registerAllMocks(tr);

tr.run();
