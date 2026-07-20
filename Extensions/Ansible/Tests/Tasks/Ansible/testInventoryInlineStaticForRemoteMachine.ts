import { createRunner, configureBaseRemoteMachine, setSshEndpointEnvironment } from './scenarioHelpers';

const runner = createRunner();
configureBaseRemoteMachine(runner);

runner.setInput('inventoriesRemoteMachine', 'inlineContent');
runner.setInput('inventoryInlineDynamicRemoteMachine', 'false');
runner.setInput('inventoryInlineContentRemoteMachine', 'DUMMY_IP_ADDRESS');

setSshEndpointEnvironment();

runner.run();
