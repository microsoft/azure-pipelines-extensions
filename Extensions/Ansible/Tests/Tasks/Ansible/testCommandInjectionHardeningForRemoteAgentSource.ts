import { createRunner, setSshEndpointEnvironment, EndpointId } from './scenarioHelpers';

// Regression test for the remoteMachine + inventoryType=file +
// inventoryFileSource=agentMachine flow. The inventory / playbook artifacts are
// copied to '/tmp/' + basename(userInput) BEFORE the base class runs, so a file
// name that contains shell metacharacters used to reach the remote shell
// unescaped through the '-i' argument and the 'rm -f' / 'rm -rf' cleanup
// commands. With the hardening feature flag enabled every one of those shell
// sinks must be shell-quoted.
process.env['DISTRIBUTEDTASK_TASKS_AZP_75787_ENABLE_NEW_LOGIC'] = 'true';

const runner = createRunner();
setSshEndpointEnvironment();

runner.setInput('ansibleInterface', 'remoteMachine');
runner.setInput('connectionOverSsh', EndpointId);
runner.setInput('playbookSourceRemoteMachine', 'agentMachine');
runner.setInput('inventoriesRemoteMachine', 'file');
runner.setInput('inventoryFileSourceRemoteMachine', 'agentMachine');
runner.setInput('sudoEnabled', 'false');
runner.setInput('args', '');

runner.setInput('playbookRootRemoteMachine', '/path/to/pbroot;$(id)');
runner.setInput('playbookPathLinkedArtifactOnRemoteMachine', 'ansiblePlaybook.yml');
runner.setInput('inventoryFileLinkedArtifactOnRemoteMachine', '/path/to/inv;$(id).ini');

runner.run();
