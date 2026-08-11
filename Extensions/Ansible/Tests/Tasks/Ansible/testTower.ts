import { createRunner, configureBaseTower, setTowerEnvironment } from './scenarioHelpers';

const runner = createRunner();
configureBaseTower(runner);
setTowerEnvironment();

runner.run();
