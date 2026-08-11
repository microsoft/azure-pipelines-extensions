import { createRunner, configureBaseTower, setTowerEnvironment, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseTower(runner);
setTowerEnvironment();

getMockUtils().setMockTowerLaunchStatusCode(500);

runner.run();
