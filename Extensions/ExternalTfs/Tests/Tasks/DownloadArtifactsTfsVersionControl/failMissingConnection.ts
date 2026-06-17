import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH, CHANGESET_ID,
    registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsVersionControl', 'downloadTfsVersionControl.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// connection deliberately not set -> getEndpointDetails throws
// "Could not decode the External Tfs endpoint."
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', REPOSITORY_ID);
tr.setInput('version', CHANGESET_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

registerAllMocks(tr);

tr.run();
