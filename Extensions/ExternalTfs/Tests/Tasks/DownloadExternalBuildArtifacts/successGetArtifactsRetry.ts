import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    TFS_CONNECTION_ID, PROJECT_ID, BUILD_ID, DOWNLOAD_PATH,
    setTfsEndpoint, registerAllMocks, compressSetTimeout
} from './mockHelpers';

// Compress the 4-second retry backoff into ~5ms so the test stays fast
// while still exercising the real executeWithRetries() path in download.ts.
compressSetTimeout();

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadExternalBuildArtifacts', 'download.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'reposOrTfs');
tr.setInput('connection', TFS_CONNECTION_ID);
tr.setInput('project', PROJECT_ID);
tr.setInput('definition', 'build-def-id');
tr.setInput('version', BUILD_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

setTfsEndpoint({ scheme: 'Token' });

// First getArtifacts call rejects, second succeeds. download.ts allows up to
// 3 retries (maxRetries = 3) so this exercises one retry without exhausting.
registerAllMocks(tr, {
    artifacts: [{ type: 'container', name: 'drop', data: '#/123/drop' }],
    getArtifactsFailures: 1
});

tr.run();
