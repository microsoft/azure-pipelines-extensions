import { createRunner, configureBaseRemoteMachine, setSshEndpointEnvironment } from './scenarioHelpers';

const runner = createRunner();
configureBaseRemoteMachine(runner);

setSshEndpointEnvironment({
    password: 'passphrase',
    privateKey: 'mock-private-key'
});

runner.run();
