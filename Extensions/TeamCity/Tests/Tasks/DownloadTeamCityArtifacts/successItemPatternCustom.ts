import path = require('path');
import tmrm = require('azure-pipelines-task-lib/mock-run');

import { ITEM_PATTERN_CUSTOM, registerAllMocks, setEndpointAuth, setRequiredInputs } from './mockHelpers';

const taskPath = path.join(__dirname, '../../../Src/Tasks/DownloadTeamCityArtifacts/download.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

setRequiredInputs(tr, { itemPattern: ITEM_PATTERN_CUSTOM });
setEndpointAuth();
registerAllMocks(tr);

tr.run();
