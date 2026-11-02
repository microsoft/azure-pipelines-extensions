import path = require('path');

import mockrun = require('azure-pipelines-task-lib/mock-run');
import mockToolRunner = require('azure-pipelines-task-lib/mock-toolrunner');

import * as mockAnsibleUtils from './mockAnsibleUtils';

const taskPath = path.join(__dirname, '../../../Src/Tasks/Ansible/main.js');
const runner = new mockrun.TaskMockRunner(taskPath);
runner.setInput('ansibleInterface', 'agentMachine');
runner.setInput('connectionOverSsh', '8b04f8a5-9a17-474d-836c-60c24edcfa50');
runner.setInput('inventoriesAgentMachine', 'inlineContent');
runner.setInput('sudoEnabled', 'false');
runner.setInput('args', "");

runner.setInput('playbookPathOnAgentMachine', '/path/to/ansiblePlaybookRoot/ansiblePlaybook.yml');
runner.setInput('inventoryInlineDynamicAgentMachine', 'true');
runner.setInput('inventoryInlineContentAgentMachine', 'DUMMY_IP_ADDRESS');

process.env["AZURE_HTTP_USER_AGENT"] = "TFS_useragent";
process.env["ENDPOINT_AUTH_PARAMETER_8b04f8a5-9a17-474d-836c-60c24edcfa50_USERNAME"] = "DummyUser";
process.env["ENDPOINT_AUTH_PARAMETER_8b04f8a5-9a17-474d-836c-60c24edcfa50_PASSWORD"] = "DummyPassword";
process.env["ENDPOINT_DATA_8b04f8a5-9a17-474d-836c-60c24edcfa50_HOST"] = "true dummy host";
process.env["ENDPOINT_DATA_8b04f8a5-9a17-474d-836c-60c24edcfa50_PORT"] = "22";

runner.registerMock('azure-pipelines-task-lib/toolrunner', mockToolRunner);

runner.registerMock('./ansibleUtils', mockAnsibleUtils);

runner.run();





