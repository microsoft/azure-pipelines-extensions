import path = require('path');
import tmrm = require('azure-pipelines-task-lib/mock-run');

import { registerAllMocks, setEndpointAuth, setRequiredInputs, SOURCE_TASK_PATH } from './mockHelpers';

const taskPath = path.join(process.cwd(), SOURCE_TASK_PATH);
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

setRequiredInputs(tr);
setEndpointAuth({ scheme: 'Token' });
registerAllMocks(tr, {
    apiResponseText: JSON.stringify({
        scm: 'hg',
        links: {
            clone: [
                { href: 'https://bitbucket.org/org/repo.git' }
            ]
        }
    })
});

tr.run();
