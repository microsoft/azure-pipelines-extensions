import path = require('path');
import tmrm = require('azure-pipelines-task-lib/mock-run');

import { registerAllMocks, setEndpointAuth, setRequiredInputs } from './mockHelpers';

const taskPath = path.join(__dirname, '../../../Src/Tasks/DownloadTeamCityArtifacts/download.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Pattern that matches nothing — task should still succeed.
setRequiredInputs(tr, { itemPattern: 'nonexistent/**' });
setEndpointAuth();
registerAllMocks(tr, { availableItems: ['src/main.ts', 'lib/utils.js', 'docs/readme.md'] });

tr.run();
