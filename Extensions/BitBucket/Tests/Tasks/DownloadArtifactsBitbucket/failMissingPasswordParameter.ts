import path = require('path');
import tmrm = require('azure-pipelines-task-lib/mock-run');

import { registerAllMocks, setEndpointAuth, setRequiredInputs, SOURCE_TASK_PATH } from './mockHelpers';

const taskPath = path.join(process.cwd(), SOURCE_TASK_PATH);
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

setRequiredInputs(tr);
setEndpointAuth({
    scheme: 'UsernamePassword',
    authParameters: {
        username: 'bb-user'
    }
});
registerAllMocks(tr);

tr.run();
