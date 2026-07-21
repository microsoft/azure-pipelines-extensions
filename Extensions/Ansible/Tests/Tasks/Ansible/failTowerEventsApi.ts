import { createRunner, configureBaseTower, setTowerEnvironment, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseTower(runner);
setTowerEnvironment();

const mockUtils = getMockUtils();
mockUtils.setMockTowerStatusSequence(['running']);
mockUtils.setMockTowerEventsStatusCode(500);

runner.run();
