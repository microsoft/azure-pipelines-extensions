import { createRunner, configureBaseRemoteMachine, setSshEndpointEnvironment } from './scenarioHelpers';

const runner = createRunner();
configureBaseRemoteMachine(runner);

setSshEndpointEnvironment({
    password: 'passphrase',
    privateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----'
});

runner.run();
