import { createRunner, configureBaseTower, setTowerEnvironment, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseTower(runner);
setTowerEnvironment();

getMockUtils().setMockTowerStatusStatusCode(500);

runner.run();