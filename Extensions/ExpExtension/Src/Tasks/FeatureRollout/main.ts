import * as tl from 'azure-pipelines-task-lib';
import * as fs from 'fs';
import FeatureManager from './featuremanager';

async function run() {
    try {
        let serviceConnectionId = tl.getInput('ServiceConnectionId', true);
        let action = tl.getInput('Action', true);
        let featureId = tl.getInput('ExperimentId', false);
        let featureJsonPath = tl.getInput('FeatureJsonPath', false);
        let progressionJsonPath = tl.getInput('ProgressionJsonPath', false);

        let featureManager = new FeatureManager(serviceConnectionId, tl.getVariable('AZURE_HTTP_USER_AGENT'));

        if (action === 'CreateFeature') {
            let featureBody = JSON.parse(fs.readFileSync(featureJsonPath).toString());
            await featureManager.createFeatureRollout(featureBody);
        }
        else if (action === 'CreateProgression') {
            let progressionBody = JSON.parse(fs.readFileSync(progressionJsonPath).toString());
            await featureManager.createProgression(featureId, progressionBody);
        }
        else {
            throw new Error(`Invalid action ${action}`);
        }
    }
    catch (error) {
        tl.setResult(tl.TaskResult.Failed, error);
    }
}

run();