import { createRunner, configureBaseRemoteMachine, setSshEndpointEnvironment } from './scenarioHelpers';

const runner = createRunner();
configureBaseRemoteMachine(runner);

setSshEndpointEnvironment({ port: '' });

runner.run();
