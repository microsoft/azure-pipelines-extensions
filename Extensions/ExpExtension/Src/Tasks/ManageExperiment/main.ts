import * as tl from 'azure-pipelines-task-lib';
import ExperimentManager, { ExperimentAction } from './experimentmanager';

async function run() {
    try {
        let serviceConnectionId = tl.getInput('ServiceConnectionId', true);
        let experimentId = tl.getInput('ExperimentId', true);
        let action = tl.getInput('Action', true);

        let experimentmanager = new ExperimentManager(serviceConnectionId, experimentId, tl.getVariable("AZURE_HTTP_USER_AGENT"));
        await experimentmanager.executeAction(ExperimentAction[action]);
    }
    catch (error) {
        tl.setResult(tl.TaskResult.Failed, error);
    }
}

run();