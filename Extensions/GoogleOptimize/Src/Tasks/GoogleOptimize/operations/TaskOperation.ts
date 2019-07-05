import {IExperiment} from './../models/IOptimize';
import {Optimizeclient} from './optimizeclient'
import {TaskParameter} from './../models/TaskParameter';

export class TaskOperation {

    private oxclient: Optimizeclient;
    private param: TaskParameter;

    constructor() {
        this.oxclient = new Optimizeclient();
        this.param = TaskParameter.getInstance();
    }

    public async stopExperiment(experiment: IExperiment): Promise < void > {
        experiment.status = this.param.Status.ENDED;
        await this.oxclient.updateExperiment(experiment);
    }

    public async updateExperiment(experiment: IExperiment): Promise < void > {
        experiment.status = this.param.Status.RUNNING;
        await this.oxclient.updateExperiment(experiment);
    }

}
