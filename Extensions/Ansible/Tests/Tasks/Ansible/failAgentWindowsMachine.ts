import { createRunner, configureBaseAgentMachine, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseAgentMachine(runner);

getMockUtils().setMockAgentPlatform('win32');

runner.run();
