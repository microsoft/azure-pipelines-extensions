import { createRunner, configureBaseTower, setTowerEnvironment, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseTower(runner);
setTowerEnvironment();

getMockUtils().setMockTowerTemplate(200, false);

runner.run();
