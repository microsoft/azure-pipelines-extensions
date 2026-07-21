import { createRunner, configureBaseRemoteMachine, setSshEndpointEnvironment, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseRemoteMachine(runner);
runner.setInput('failOnStdErr', 'true');

setSshEndpointEnvironment();
getMockUtils().setMockFailRemoteOnStdErr(true);

runner.run();
