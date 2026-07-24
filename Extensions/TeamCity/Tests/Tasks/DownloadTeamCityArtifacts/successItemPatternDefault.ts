import path = require('path');
import tmrm = require('azure-pipelines-task-lib/mock-run');

import { registerAllMocks, setEndpointAuth, setRequiredInputs } from './mockHelpers';

const taskPath = path.join(__dirname, '../../../Src/Tasks/DownloadTeamCityArtifacts/download.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// itemPattern intentionally omitted — task should default to '**'.
setRequiredInputs(tr);
setEndpointAuth();
registerAllMocks(tr);

tr.run();
