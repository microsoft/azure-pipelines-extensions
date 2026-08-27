import { createRunner, configureBaseAgentMachine } from './scenarioHelpers';

// Regression test for the JSON --extra-vars corruption bug: enabling the
// hardening feature flag must NOT alter a legitimately quoted argument. The
// previous tokenizer stripped the inner quotes, turning
//   --extra-vars '{"a":"b"}'  into  --extra-vars {a:b}
// which ansible-playbook silently mis-parses as YAML. The quote-aware
// neutralizer must round-trip such safe inputs unchanged while still escaping
// genuine injection sequences.
process.env['DISTRIBUTEDTASK_TASKS_AZP_75787_ENABLE_NEW_LOGIC'] = 'true';

const runner = createRunner();
configureBaseAgentMachine(runner);
runner.setInput('playbookPathOnAgentMachine', '/path/to/ansiblePlaybookRoot/ansiblePlaybook.yml');
runner.setInput('inventoriesAgentMachine', 'hostList');
runner.setInput('inventoryHostListAgentMachine', 'Dummy_IP_Address');
runner.setInput('sudoEnabled', 'false');
runner.setInput('args', '--extra-vars \'{"a":"b"}\'');

runner.run();
