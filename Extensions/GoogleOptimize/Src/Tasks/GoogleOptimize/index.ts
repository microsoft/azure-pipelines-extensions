import {Optimizeclient} from './operations/optimizeclient';
import {IVariation, IExperiment} from './operations/IOptimize';
import {TaskOperation} from './operations/TaskOperation' ;
import * as tl from 'azure-pipelines-task-lib/task';
import * as schema from './models/Schema.json' ;
import {TaskParameter} from './models/TaskParameter';
const fs = require('fs');

async function run() {
    try {
        let param  : TaskParameter = new TaskParameter();
        let trafficCoverage : number | null = param.getTrafficCoverage() ;
        let equalWeighting : boolean | null = param.getEqualWeighting() ;
        let action : string = param.getAction();
        let filePath : string | null = param.getFilePath() ;

        let taskOperation = new TaskOperation() ;

        let experiment: IExperiment ;

        if(filePath.endsWith('.json') ) {
            let rawdata = fs.readFileSync(filePath);
            experiment = JSON.parse(rawdata);
            if(param.getExperimentId() != experiment.id) {
                throw tl.loc("IdMismatch") ;
            }
            for(var key in experiment){
               if(!(key in schema)){
                   throw tl.loc("KeyNotFound" , key) ;
               }
            }
        }
        else {
            experiment = {
                "id" : param.getExperimentId()
            }
        }

        if(trafficCoverage != null ) {
            experiment.trafficCoverage = trafficCoverage ;
        }

        if(equalWeighting != null ) {
            experiment.equalWeighting = equalWeighting ;
        }

        switch(action){
            case "StopExperiment":
                await taskOperation.stopExperiment(experiment);
                break;
            case "UpdateExperiment":
                await taskOperation.updateExperiment(experiment);
                break;
            case "PauseExperiment":
                await taskOperation.pauseExperiment(experiment);
                break;
            default:
                throwError();
        }
    }
    catch(err){
        tl.setResult(tl.TaskResult.Failed , err.message);
    }
}

function throwError(){
    throw tl.loc("InvalidAction")
}

run() ;
