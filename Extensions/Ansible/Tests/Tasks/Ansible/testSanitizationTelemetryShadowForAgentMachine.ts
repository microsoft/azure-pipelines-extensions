import { createRunner, configureBaseAgentMachine } from './scenarioHelpers';

// Telemetry (shadow mode) test: with only AZP_2457936_ENABLE_COLLECT enabled the
// task must keep its legacy (unquoted) behaviour but still report which commands
// the fix WOULD change. The signal is legacyValue !== hardenedValue, so a
// playbook path that merely contains a space (no shell metacharacter) must be
// reported even though the old metacharacter-only heuristic would have missed
// it.
process.env['DISTRIBUTEDTASK_TASKS_AZP_2457936_ENABLE_COLLECT'] = 'true';
delete process.env['DISTRIBUTEDTASK_TASKS_AZP_2457936_ENABLE_NEW_LOGIC'];

const runner = createRunner();
configureBaseAgentMachine(runner);
runner.setInput('playbookPathOnAgentMachine', '/opt/my play/site.yml');
runner.setInput('inventoriesAgentMachine', 'hostList');
runner.setInput('inventoryHostListAgentMachine', 'Dummy_IP_Address');
runner.setInput('sudoEnabled', 'false');
runner.setInput('args', '');

runner.run();
