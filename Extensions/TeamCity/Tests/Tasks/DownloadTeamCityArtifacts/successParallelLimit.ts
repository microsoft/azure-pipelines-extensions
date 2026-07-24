import path = require('path');
import tmrm = require('azure-pipelines-task-lib/mock-run');

import { registerAllMocks, setEndpointAuth, setRequiredInputs } from './mockHelpers';

// `release.artifact.download.parallellimit` is a system/user variable that
// tl.getVariable reads as env `RELEASE_ARTIFACT_DOWNLOAD_PARALLELLIMIT`.
process.env['RELEASE_ARTIFACT_DOWNLOAD_PARALLELLIMIT'] = '8';

const taskPath = path.join(__dirname, '../../../Src/Tasks/DownloadTeamCityArtifacts/download.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

setRequiredInputs(tr);
setEndpointAuth();
registerAllMocks(tr);

tr.run();
