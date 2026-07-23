import { createRunner, configureBaseRemoteMachine, setSshEndpointEnvironment, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseRemoteMachine(runner);

setSshEndpointEnvironment();
getMockUtils().setMockRemoteCommandError('mock remote command failed');

runner.run();
