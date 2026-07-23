import { createRunner, setSshEndpointEnvironment, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
runner.setInput('ansibleInterface', 'remoteMachine');
runner.setInput('connectionOverSsh', '8b04f8a5-9a17-474d-836c-60c24edcfa50');
runner.setInput('playbookSourceRemoteMachine', 'ansibleMachine');
runner.setInput('playbookPathAnsibleMachineOnRemoteMachine', '/path/to/ansiblePlaybookRoot/ansiblePlaybook.yml');
runner.setInput('inventoriesRemoteMachine', 'file');
runner.setInput('inventoryFileSourceRemoteMachine', 'agentMachine');
runner.setInput('inventoryFileLinkedArtifactOnRemoteMachine', '/path/to/ansibleInventory');
runner.setInput('sudoEnabled', 'false');
runner.setInput('args', '');

setSshEndpointEnvironment();
getMockUtils().setMockFileExists('/path/to/ansibleInventory', false);

runner.run();
