import { createRunner, configureBaseRemoteMachine, setSshEndpointEnvironment } from './scenarioHelpers';

const runner = createRunner();
configureBaseRemoteMachine(runner);
runner.setInput('sudoEnabled', 'true');
runner.setInput('sudoUser', 'deployer');

setSshEndpointEnvironment();

runner.run();