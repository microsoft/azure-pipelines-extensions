import { TaskParameter } from './../models/TaskParameter';
import {IVariation , IExperiment} from './IOptimize';
import {Optimizeclient} from './optimizeclient'
import * as tl from 'azure-pipelines-task-lib/task';
import * as schema from './../models/Schema.json'

const fs = require('fs');
export class TaskOperation {

    private param: TaskParameter ;
    private experimentId : string ;
    private currentExperiment :IExperiment ;
    private oxclient : Optimizeclient ;

    constructor(){
        this.param = new TaskParameter() ;
        this.experimentId = this.param.getExperimentId() ;
        this.oxclient = new Optimizeclient() ;
        this.currentExperiment = this.getExperiment();
    }
    public async pauseExperiment(experiment:IExperiment):Promise<void> {
        if(this.currentExperiment.status === "RUNNING"){
            experiment.trafficCoverage = 0 ;
            await this.oxclient.updateExperiment(experiment  , this.param);
        }
        else{
            throw tl.loc("PauseFailed");
        }
    }

    public async stopExperiment(experiment:IExperiment ):Promise<void> {

        if(this.currentExperiment.status !== "ENDED"){
            experiment.status = "ENDED";
            await this.oxclient.updateExperiment(experiment  , this.param);
        }
        else{
            throw tl.loc("StopFailed");
        }

    }

    public async updateExperiment(experiment:IExperiment ):Promise<void>{
        if(this.currentExperiment.status !== "ENDED"){
            experiment.status = "RUNNING";
            await this.oxclient.updateExperiment(experiment  , this.param);
        }
        else{
            throw tl.loc("StartFailed");
        }
    }

    public async updateTrafficCoverage(experiment:IExperiment ):Promise<void> {
        let traffic:number = experiment.trafficCoverage ;
        if(Number.isNaN(traffic) || (traffic > 1) || (traffic) < 0 ){
            throw tl.loc("TrafficValueNotValid" , traffic)
        }
        await this.oxclient.updateExperiment(experiment , this.param) ;
    }

    public async updateEqualWeighting(experiment:IExperiment ):Promise<void> {
        await this.oxclient.updateExperiment(experiment  , this.param);
    }

    private async getExperiment():Promise<IExperiment> {
        return await this.oxclient.getExperiment(this.param) ;
    }

}
