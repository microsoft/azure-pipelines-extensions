import { createRunner, configureBaseTower, setTowerEnvironment, getMockUtils } from './scenarioHelpers';

const runner = createRunner();
configureBaseTower(runner);
setTowerEnvironment();

const mockUtils = getMockUtils();
mockUtils.setMockTowerStatusSequence(['successful']);
mockUtils.setMockTowerEventsPages([
    {
        count: 2,
        next: '/api/v1/jobs/559/job_events/?page_size=10&page=2',
        previous: null,
        results: [
            {
                id: 100,
                type: 'job_event',
                job: 559,
                counter: 1,
                stdout: 'Page1 stdout'
            }
        ]
    },
    {
        count: 2,
        next: null,
        previous: '/api/v1/jobs/559/job_events/?page_size=10&page=1',
        results: [
            {
                id: 101,
                type: 'job_event',
                job: 559,
                counter: 2,
                stdout: 'Page2 stdout'
            }
        ]
    }
]);

runner.run();
