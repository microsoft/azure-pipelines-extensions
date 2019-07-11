import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..','index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('googleEndpoint', 'b2a89421-36e7-4bff-b7af-01f3c8796ece');
tmr.setInput('accountId', 'dummyAccountId');
tmr.setInput('webPropertyId', 'dummyWebPropertyId');
tmr.setInput('profileId', 'dummyProfileId');
tmr.setInput('experimentName', 'dummyExperimentName');
tmr.setInput('action', 'UpdateExperiment');
tmr.setInput('trafficCoverage', '0.21');
tmr.setInput('equalWeighting', 'True');
tmr.setInput('jsonFile', './jsonFiles/incorrect_id.json');

//process.env["AZURE_HTTP_USER_AGENT"] = "TFS_useragent";
process.env["ENDPOINT_AUTH_PARAMETER_b2a89421-36e7-4bff-b7af-01f3c8796ece_Issuer"] = "correctIssuer";
process.env["ENDPOINT_AUTH_PARAMETER_b2a89421-36e7-4bff-b7af-01f3c8796ece_Audience"] = "correctAudience";
process.env["ENDPOINT_AUTH_PARAMETER_b2a89421-36e7-4bff-b7af-01f3c8796ece_Scope"] = "dummyScope";
process.env["ENDPOINT_AUTH_PARAMETER_b2a89421-36e7-4bff-b7af-01f3c8796ece_PrivateKey"] = "dummyPrivateKey";

var tl = require('azure-pipelines-task-lib/mock-task');
tmr.registerMock('azure-pipelines-task-lib/toolrunner', require('azure-pipelines-task-lib/mock-toolrunner'));
tmr.registerMock('azure-pipelines-task-lib/task', "azure-pipelines-task-lib/mock-task");
tmr.registerMock('./../models/GoogleAnalyticsUtils', require("./../models/MockGoogleAnalyticsUtils"));


tmr.run();
