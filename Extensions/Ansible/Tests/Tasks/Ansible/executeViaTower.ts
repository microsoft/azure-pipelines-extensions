import mockanswer = require('vsts-task-lib/mock-answer');
import mockrun = require('vsts-task-lib/mock-run');
import path = require('path');


let taskPath = path.join(__dirname, '../../../Src/Tasks/Ansible/main.js');
let runner = new mockrun.TaskMockRunner(taskPath);
runner.setInput('ansibleInterface', 'ansibleTower');
runner.setInput('connectionAnsibleTower', '8b04f8a5-9a17-474d-836c-60c24edcfa50');
runner.setInput('jobTemplateName', 'Demo Job Template 3');

process.env["AZURE_HTTP_USER_AGENT"] = "TFS_useragent";
process.env["ENDPOINT_AUTH_PARAMETER_8b04f8a5-9a17-474d-836c-60c24edcfa50_USERNAME"] = "DummyUser";
process.env["ENDPOINT_AUTH_PARAMETER_8b04f8a5-9a17-474d-836c-60c24edcfa50_PASSWORD"] = "DummyPassword";
process.env["ENDPOINT_URL_8b04f8a5-9a17-474d-836c-60c24edcfa50"] = "true dummy host";

var tl = require('vsts-task-lib/mock-task');
runner.registerMock('vsts-task-lib/toolrunner', require('vsts-task-lib/mock-toolrunner'));
runner.registerMock('vsts-task-lib/task', "vsts-task-lib/mock-task");

runner.registerMock('./ansibleUtils', require('./mockAnsibleUtils'));

runner.run();
