import { createRunner, setSshEndpointEnvironment, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
runner.setInput('ansibleInterface', 'remoteMachine');
runner.setInput('connectionOverSsh', '8b04f8a5-9a17-474d-836c-60c24edcfa50');
runner.setInput('playbookSourceRemoteMachine', 'agentMachine');
runner.setInput('playbookRootRemoteMachine', '/path/to/ansiblePlaybookRoot');
runner.setInput('playbookPathLinkedArtifactOnRemoteMachine', 'ansiblePlaybook.yml');
runner.setInput('inventoriesRemoteMachine', 'hostList');
runner.setInput('inventoryHostListRemoteMachine', 'Dummy_IP_Address');
runner.setInput('sudoEnabled', 'false');
runner.setInput('args', '');

setSshEndpointEnvironment();
getMockUtils().setMockCopyError('mock scp failed');

runner.run();
