import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    PROJECT_ID, BUILD_ID, DOWNLOAD_PATH,
    registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadExternalBuildArtifacts', 'download.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'reposOrTfs');
// connection deliberately not set
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', 'build-def-id');
tr.setInput('version', BUILD_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

registerAllMocks(tr);

tr.run();
