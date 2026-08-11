import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    TFS_CONNECTION_ID, PROJECT_ID, BUILD_ID, DOWNLOAD_PATH,
    setTfsEndpoint, registerAllMocks
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadExternalBuildArtifacts', 'download.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'reposOrTfs');
tr.setInput('connection', TFS_CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', 'build-def-id');
tr.setInput('version', BUILD_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

setTfsEndpoint({ scheme: 'Token' });

// symbolStore is neither "container" nor "filepath" -> task should log a
// warning and skip it without invoking the artifact engine.
registerAllMocks(tr, {
    artifacts: [{ type: 'symbolStore', name: 'symbols', data: 'irrelevant' }]
});

tr.run();
