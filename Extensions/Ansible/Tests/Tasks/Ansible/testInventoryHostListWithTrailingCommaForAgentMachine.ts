import { createRunner, configureBaseAgentMachine } from './scenarioHelpers';

const runner = createRunner();
configureBaseAgentMachine(runner);
runner.setInput('inventoriesAgentMachine', 'hostList');
runner.setInput('inventoryHostListAgentMachine', 'Dummy_IP_Address,');

runner.run();
