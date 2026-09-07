import { createRunner, configureBaseAgentMachine } from './scenarioHelpers';

// Regression test for the JSON --extra-vars corruption bug: enabling the
// hardening feature flag must NOT semantically alter a legitimately quoted
// argument. The old shellSplit stripped the inner quotes, turning
//   --extra-vars '{"a":"b"}'  into  --extra-vars {a:b}
// which ansible-playbook silently mis-parses as YAML. The fixed library
// preserves the inner quotes during tokenization and shellQuote re-quotes each
// token ('--extra-vars' '{"a":"b"}'), so the shell hands the original JSON
// object back to ansible-playbook intact as a single literal argument.
process.env['DISTRIBUTEDTASK_TASKS_AZP_2457936_ENABLE_NEW_LOGIC'] = 'true';

const runner = createRunner();
configureBaseAgentMachine(runner);
runner.setInput('playbookPathOnAgentMachine', '/path/to/ansiblePlaybookRoot/ansiblePlaybook.yml');
runner.setInput('inventoriesAgentMachine', 'hostList');
runner.setInput('inventoryHostListAgentMachine', 'Dummy_IP_Address');
runner.setInput('sudoEnabled', 'false');
runner.setInput('args', '--extra-vars \'{"a":"b"}\'');

runner.run();
