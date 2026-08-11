import { createRunner, configureBaseAgentMachine } from './scenarioHelpers';

const runner = createRunner();
configureBaseAgentMachine(runner);
runner.setInput('inventoriesAgentMachine', 'inlineContent');
runner.setInput('inventoryInlineDynamicAgentMachine', 'false');
runner.setInput('inventoryInlineContentAgentMachine', 'DUMMY_IP_ADDRESS');
runner.setInput('playbookPathOnAgentMachine', '/path/to/ansiblePlaybookRoot/ansiblePlaybook.yml');

runner.run();