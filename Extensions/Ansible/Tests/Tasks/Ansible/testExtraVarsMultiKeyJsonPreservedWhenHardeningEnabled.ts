import { createRunner, configureBaseAgentMachine } from './scenarioHelpers';

// Regression test for the multi-key JSON --extra-vars brace-expansion bug.
// A single-key object survives even a naive escaper because it has no comma,
// but a multi-key object exposes the real hazard: bash brace-expands an
// unquoted  {"a":"b","c":"d"}  into two words  {"a":"b"}  and  {"c":"d"}  (the
// braces are consumed and the JSON is destroyed). Escaping command-substitution
// metacharacters alone does NOT neutralize brace expansion. shellQuote wraps
// each token in single quotes, which keeps  { } ,  literal, so the shell hands
// the original JSON object back to ansible-playbook intact as one argument.
process.env['DISTRIBUTEDTASK_TASKS_AZP_2457936_ENABLE_NEW_LOGIC'] = 'true';

const runner = createRunner();
configureBaseAgentMachine(runner);
runner.setInput('playbookPathOnAgentMachine', '/path/to/ansiblePlaybookRoot/ansiblePlaybook.yml');
runner.setInput('inventoriesAgentMachine', 'hostList');
runner.setInput('inventoryHostListAgentMachine', 'Dummy_IP_Address');
runner.setInput('sudoEnabled', 'false');
runner.setInput('args', '--extra-vars \'{"a":"b","c":"d"}\'');

runner.run();
