import * as path from 'path';

import * as tl from 'azure-pipelines-task-lib';

import ExperimentManager, { ExperimentAction } from './experimentmanager';

async function run() {
    try {
        tl.setResourcePath(path.join( __dirname, 'task.json'));

        let serviceConnectionId = tl.getInput('ServiceConnectionId', true)!;
        let featureId = tl.getInput('FeatureId', true)!;
        let progressionId = tl.getInput('ProgressionId', true)!;
        let experimentName = tl.getInput('ExperimentName', true)!;
        let action = tl.getInput('Action', true)!;

        // @ts-ignore enum needs to be refactored to use string values
        if (!ExperimentAction[action]) {
            throw new Error(tl.loc('InvalidAction', action));
        }

        let experimentmanager = new ExperimentManager(featureId, progressionId, serviceConnectionId, tl.getVariable("AZURE_HTTP_USER_AGENT")!);
        let experiment = await experimentmanager.getExperiment(experimentName);

        // @ts-ignore enum needs to be refactored to use string values
        await experimentmanager.executeAction(experiment.Id, ExperimentAction[action]);
    }
    catch (error) {
        tl.setResult(tl.TaskResult.Failed, error as string);
    }
}

run();