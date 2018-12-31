import { OptimizelyXClient, IOptimizelyAlphaBetaTest, IOptimizelyEnvironment, OptimizelyExperimentStatus } from './operations/OptimizelyXClient';
import { OptimizelyTaskParameter } from './models/OptimizelyTaskParameter'
import { TaskOperation } from './operations/TaskOperation';
import * as tl from 'azure-pipelines-task-lib/task';
import path = require('path');

async function run() {
    tl.setResourcePath(path.join( __dirname, 'task.json'));

    let taskInputs =  new OptimizelyTaskParameter();
    let taskOperation = new TaskOperation(taskInputs);

    let optimizelyClient = taskOperation.getOptimizelyClientInstance();

    let projectId: string = taskInputs.getProjectId();
    console.log(tl.loc("ProjectId", projectId));
    let project = await optimizelyClient.getProject(projectId);

    taskInputs.setProjectType(project.platform);

    let experimentId: string = taskInputs.getExperimentId();
    let experiment: IOptimizelyAlphaBetaTest = await optimizelyClient.getExperiment(projectId, experimentId);

    experiment = taskOperation.updateTrafficVariation(experiment);
    experiment.audience_conditions = await taskOperation.getAudienceCondition(projectId);

    let action: string = taskInputs.getAction();
    if (action.toLowerCase() === 'startabtest') {
        await taskOperation.startABTest(experiment);
    } else if (action.toLowerCase() === 'pauseabtest') {
        await taskOperation.pauseABTest(experiment);
    } else {
        throw tl.loc("InvalidAction", action);
    }
}

run().then((value) => {
    console.log(tl.loc("TaskSucceeded"));
}, (error) => {
    tl.setResult(tl.TaskResult.Failed, error);
});
