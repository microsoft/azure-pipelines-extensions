import {Optimizeclient} from './operations/optimizeclient';
import {IVariation,IExperiment} from './models/IOptimize';
import {TaskOperation} from './operations/TaskOperation';
import {TaskParameter} from './models/TaskParameter';
import * as tl from 'azure-pipelines-task-lib/task';
import * as schema from './models/Schema.json';
const path = require('path');
const fs = require('fs');

async function run() {
    try {
        tl.setResourcePath(path.join(__dirname + '\\task.json'));
        let param: TaskParameter = TaskParameter.getInstance();
        let trafficCoverage: number | null = param.trafficCoverage;
        let equalWeighting: boolean | null = param.equalWeighting;
        let action: string = param.action;
        let filePath: string | null = param.filePath;

        let taskOperation = new TaskOperation();

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
            for (var key in experiment) {
                if (!(key in schema)) {
                    throw tl.loc("KeyNotFound", key);
                }
            }
        } else {
            experiment = {
                "id": param.experimentId
            };
        }

        if (trafficCoverage != null) {
            experiment.trafficCoverage = trafficCoverage;
        }

        if (equalWeighting != null) {
            experiment.equalWeighting = equalWeighting;
        }

        switch (action) {
            case "StopExperiment":
                await taskOperation.stopExperiment(experiment);
                break;
            case "UpdateExperiment":
                await taskOperation.updateExperiment(experiment);
                break;
            default:
                throwError();
        }
    } catch (err) {
        console.log(err);
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

function throwError() {
    throw tl.loc("InvalidAction")
}

run();
