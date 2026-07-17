import mockanswer = require('azure-pipelines-task-lib/mock-answer');
import mockrun = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

const mockUtils = require('./mockAnsibleUtils');

export const EndpointId = '8b04f8a5-9a17-474d-836c-60c24edcfa50';

const taskPath = path.join(__dirname, '../../../Src/Tasks/Ansible/main.js');

export function createRunner(): mockrun.TaskMockRunner {
    mockUtils.resetMockState();

    const runner = new mockrun.TaskMockRunner(taskPath);
    runner.registerMock('azure-pipelines-task-lib/toolrunner', require('azure-pipelines-task-lib/mock-toolrunner'));
    runner.registerMock('azure-pipelines-task-lib/task', require('azure-pipelines-task-lib/mock-task'));
    runner.registerMock('./ansibleUtils', mockUtils);

    process.env['AZURE_HTTP_USER_AGENT'] = 'TFS_useragent';

    return runner;
}

export function setSshEndpointEnvironment(options?: {
    username?: string;
    password?: string;
    host?: string;
    port?: string;
    privateKey?: string;
}): void {
    const username = options && options.username ? options.username : 'DummyUser';
    const password = options && options.password ? options.password : 'DummyPassword';
    const host = options && options.host ? options.host : 'true dummy host';
    const port = options && options.port !== undefined ? options.port : '22';

    process.env['ENDPOINT_AUTH_PARAMETER_' + EndpointId + '_USERNAME'] = username;
    process.env['ENDPOINT_AUTH_PARAMETER_' + EndpointId + '_PASSWORD'] = password;
    process.env['ENDPOINT_DATA_' + EndpointId + '_HOST'] = host;
    process.env['ENDPOINT_DATA_' + EndpointId + '_PORT'] = port;

    if (options && options.privateKey !== undefined) {
        process.env['ENDPOINT_DATA_' + EndpointId + '_PRIVATEKEY'] = options.privateKey;
    } else {
        delete process.env['ENDPOINT_DATA_' + EndpointId + '_PRIVATEKEY'];
    }
}

export function setTowerEnvironment(options?: {
    username?: string;
    password?: string;
    url?: string;
}): void {
    const username = (options && options.username) || 'DummyUser';
    const password = (options && options.password) || 'DummyPassword';

    process.env['ENDPOINT_AUTH_PARAMETER_' + EndpointId + '_USERNAME'] = username;
    process.env['ENDPOINT_AUTH_PARAMETER_' + EndpointId + '_PASSWORD'] = password;
    process.env['ENDPOINT_AUTH_' + EndpointId] = JSON.stringify({
        parameters: {
            username: username,
            password: password
        }
    });
    process.env['ENDPOINT_URL_' + EndpointId] = (options && options.url) || 'true dummy host';
}

export function configureBaseRemoteMachine(runner: mockrun.TaskMockRunner): void {
    runner.setInput('ansibleInterface', 'remoteMachine');
    runner.setInput('connectionOverSsh', EndpointId);
    runner.setInput('playbookSourceRemoteMachine', 'ansibleMachine');
    runner.setInput('playbookPathAnsibleMachineOnRemoteMachine', '/path/to/ansiblePlaybookRoot/ansiblePlaybook.yml');
    runner.setInput('inventoriesRemoteMachine', 'hostList');
    runner.setInput('inventoryHostListRemoteMachine', 'Dummy_IP_Address');
    runner.setInput('sudoEnabled', 'false');
    runner.setInput('args', '');
}

export function configureBaseAgentMachine(runner: mockrun.TaskMockRunner): void {
    runner.setInput('ansibleInterface', 'agentMachine');
    runner.setInput('playbookPathOnAgentMachine', 'ansiblePlaybook.yml');
    runner.setInput('inventoriesAgentMachine', 'file');
    runner.setInput('inventoryFileOnAgentMachine', '/path/to/ansibleInventory');
    runner.setInput('sudoEnabled', 'false');
    runner.setInput('args', '');
}

export function configureBaseTower(runner: mockrun.TaskMockRunner): void {
    runner.setInput('ansibleInterface', 'ansibleTower');
    runner.setInput('connectionAnsibleTower', EndpointId);
    runner.setInput('jobTemplateName', 'Demo Job Template 3');
}

export function getMockUtils(): any {
    return mockUtils;
}
