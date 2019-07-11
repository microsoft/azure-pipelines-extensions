import {IExperiment} from './models/IAnalytics';
import {TaskOperation} from './operations/TaskOperation';
import {TaskParameter} from './models/TaskParameter';
import * as tl from 'azure-pipelines-task-lib/task';
import * as schema from './models/Schema.json';
const path = require('path');
const fs = require('fs');

async function run() {
    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));
        let param: TaskParameter = TaskParameter.getInstance();
        let trafficCoverage: number | null = param.trafficCoverage;
        let equalWeighting: boolean = param.equalWeighting;
        let action: string = param.action;
        let filePath: string = param.filePath;

        let taskOperation: TaskOperation = new TaskOperation();

        let experiment: IExperiment;

        if (filePath.endsWith('.json')) {
            let rawdata;
            try {
                rawdata = fs.readFileSync(filePath);
            } catch (err) {
                throw tl.loc("FileNotFound", err);
            }

            try {
                experiment = JSON.parse(rawdata);
            } catch (err) {
                throw tl.loc("FailedToParseFile", err);
            }

            if (param.experimentId != experiment.id) {
                throw tl.loc("IdMismatch");
            }

            keyChecker(experiment, schema);

        } else {
            experiment = {
                "id": param.experimentId
            };
        }

        if (!Number.isNaN(trafficCoverage)) {
            experiment.trafficCoverage = trafficCoverage;
        }

        experiment.equalWeighting = equalWeighting;

        switch (action) {
            case "StopExperiment":
                await taskOperation.stopExperiment(experiment);
                break;
            case "UpdateExperiment":
                await taskOperation.updateExperiment(experiment);
                break;
            default:
                throw tl.loc("InvalidAction");
        }
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

function keyChecker(experiment, obj) {
    for (var key in experiment) {
        if (!(key in obj)) {
            throw tl.loc("KeyNotFound", key);
        }

        if (typeof experiment[key] === 'object') {
            keyChecker(experiment[key], obj[key]);
        }
    }
}

run();
