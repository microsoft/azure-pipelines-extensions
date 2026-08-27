import { createRunner, configureBaseAgentMachine } from './scenarioHelpers';

// Enable the OS command-injection hardening feature flag (CWE-78 fix) so the
// task quotes / neutralizes every user-controlled input before it is passed to
// ansible-playbook. getPipelineFeature reads the pipeline variable
// DistributedTask.Tasks.<name>, which maps to this environment variable.
process.env['DISTRIBUTEDTASK_TASKS_AZP_75787_ENABLE_NEW_LOGIC'] = 'true';

const runner = createRunner();
configureBaseAgentMachine(runner);
runner.setInput('playbookPathOnAgentMachine', '/path/to/ansiblePlaybookRoot/ansiblePlaybook.yml');
runner.setInput('inventoriesAgentMachine', 'hostList');
runner.setInput('inventoryHostListAgentMachine', 'Dummy_IP_Address');
runner.setInput('sudoEnabled', 'true');
runner.setInput('sudoUser', 'root ; touch /tmp/pwned');
runner.setInput('args', '; whoami');

runner.run();
