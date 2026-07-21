import { createRunner, configureBaseRemoteMachine, setSshEndpointEnvironment, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseRemoteMachine(runner);

setSshEndpointEnvironment();
getMockUtils().setMockSshSetupError('mock ssh connect failed');

runner.run();
