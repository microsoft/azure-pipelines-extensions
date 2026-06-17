import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    CONNECTION_ID, PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH,
    setEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsVersionControl', 'downloadTfsVersionControl.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connection', CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', REPOSITORY_ID);
// no version => latest changeset
tr.setInput('downloadPath', DOWNLOAD_PATH);

setEndpoint({ scheme: 'UsernamePassword' });

registerAllMocks(tr);

tr.run();
