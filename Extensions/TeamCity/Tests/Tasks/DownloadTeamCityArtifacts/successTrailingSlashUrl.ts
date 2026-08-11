import path = require('path');
import tmrm = require('azure-pipelines-task-lib/mock-run');

import { CONNECTION_ID, registerAllMocks, setEndpointAuth, setRequiredInputs } from './mockHelpers';

const taskPath = path.join(__dirname, '../../../Src/Tasks/DownloadTeamCityArtifacts/download.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

setRequiredInputs(tr);
setEndpointAuth();

// Override the endpoint URL to include a trailing slash
process.env['ENDPOINT_URL_' + CONNECTION_ID] = 'https://teamcity.example.com/';

registerAllMocks(tr);

tr.run();
