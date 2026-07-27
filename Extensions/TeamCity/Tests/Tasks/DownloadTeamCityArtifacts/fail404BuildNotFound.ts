import path = require('path');
import tmrm = require('azure-pipelines-task-lib/mock-run');

import { registerAllMocks, setEndpointAuth, setRequiredInputs } from './mockHelpers';

const taskPath = path.join(__dirname, '../../../Src/Tasks/DownloadTeamCityArtifacts/download.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

setRequiredInputs(tr, { version: '99999999' });
setEndpointAuth();
registerAllMocks(tr, {
    downloadFailStatusCode: 404,
    downloadFailMessage: 'Failed request: (statusCode) 404 - Build not found'
});

tr.run();
