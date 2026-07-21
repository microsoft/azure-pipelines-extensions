import { createRunner, configureBaseAgentMachine, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseAgentMachine(runner);

getMockUtils().setMockAnsibleAvailable(false);

runner.run();
