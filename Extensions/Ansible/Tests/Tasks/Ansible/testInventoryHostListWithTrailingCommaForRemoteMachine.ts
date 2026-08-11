import { createRunner, configureBaseRemoteMachine, setSshEndpointEnvironment } from './scenarioHelpers';

const runner = createRunner();
configureBaseRemoteMachine(runner);
runner.setInput('inventoryHostListRemoteMachine', 'Dummy_IP_Address,');

setSshEndpointEnvironment();

runner.run();