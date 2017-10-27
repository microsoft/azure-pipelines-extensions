import mockanswer = require('vsts-task-lib/mock-answer');
import mockrun = require('vsts-task-lib/mock-run');
import path = require('path');


let taskPath = path.join(__dirname, '../../../Src/Tasks/Ansible/main.js');
let runner = new mockrun.TaskMockRunner(taskPath);
runner.setInput('ansibleInterface', 'remoteMachine');
runner.setInput('connectionOverSsh', '8b04f8a5-9a17-474d-836c-60c24edcfa50');
runner.setInput('playbookSourceRemoteMachine', 'ansibleMachine');
runner.setInput('inventoriesRemoteMachine', 'hostList');
runner.setInput('sudoEnabled', 'false');
runner.setInput('args', "");

runner.setInput('playbookPathAnsibleMachineOnRemoteMachine', '/path/to/ansiblePlaybookRoot/ansiblePlaybook.yml');
runner.setInput('inventoryHostListRemoteMachine', 'Dummy_IP_Address');

process.env["AZURE_HTTP_USER_AGENT"] = "TFS_useragent";
process.env["ENDPOINT_AUTH_PARAMETER_8b04f8a5-9a17-474d-836c-60c24edcfa50_USERNAME"] = "DummyUser";
process.env["ENDPOINT_AUTH_PARAMETER_8b04f8a5-9a17-474d-836c-60c24edcfa50_PASSWORD"] = "DummyPassword";
process.env["ENDPOINT_DATA_8b04f8a5-9a17-474d-836c-60c24edcfa50_HOST"] = "true dummy host";
process.env["ENDPOINT_DATA_8b04f8a5-9a17-474d-836c-60c24edcfa50_PORT"] = "22";

var tl = require('vsts-task-lib/mock-task');
runner.registerMock('vsts-task-lib/toolrunner', require('vsts-task-lib/mock-toolrunner'));
runner.registerMock('vsts-task-lib/task', "vsts-task-lib/mock-task");

runner.registerMock('./ansibleUtils', require('./mockAnsibleUtils'));

runner.run();





