import path = require('path');
import tmrm = require('azure-pipelines-task-lib/mock-run');

import { registerAllMocks, setEndpointAuth, setRequiredInputs } from './mockHelpers';

// Simulates the S3-backend auth conflict: TeamCity Cloud / self-hosted TeamCity
// with the S3 Artifact Storage plugin returns pre-signed S3 URLs for artifact
// downloads. The task's BasicCredentialHandler unconditionally adds
// `Authorization: Basic <creds>` to those requests, which S3 rejects because it
// conflicts with the query-string signature.
//
// This test currently asserts the CURRENT (broken) behavior — it expects the
// task to fail. When the underlying bug is fixed (host-scoped auth handler),
// flip _suite.ts to expect success and rename this scenario accordingly.
const taskPath = path.join(__dirname, '../../../Src/Tasks/DownloadTeamCityArtifacts/download.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

setRequiredInputs(tr);
setEndpointAuth();
registerAllMocks(tr, {
    downloadFailStatusCode: 400,
    downloadFailMessage: 'Failed request: (statusCode) 400 - InvalidArgument: Only one auth mechanism allowed'
});

tr.run();
