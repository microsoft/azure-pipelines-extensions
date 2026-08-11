import { createRunner, configureBaseAgentMachine, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseAgentMachine(runner);
runner.setInput('failOnStdErr', 'true');

const mockUtils = getMockUtils();
mockUtils.setMockFailAgentOnStdErr(true);

runner.run();
