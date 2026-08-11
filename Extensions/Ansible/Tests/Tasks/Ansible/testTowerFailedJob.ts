import { createRunner, configureBaseTower, setTowerEnvironment, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseTower(runner);
setTowerEnvironment();

getMockUtils().setMockTowerStatusSequence(['failed']);

runner.run();
