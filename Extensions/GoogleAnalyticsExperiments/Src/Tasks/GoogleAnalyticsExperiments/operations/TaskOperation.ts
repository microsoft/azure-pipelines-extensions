import {IExperiment} from './../models/IAnalytics';
import {Analyticsclient} from './analyticsclient'
import {TaskParameter} from './../models/TaskParameter';

export class TaskOperation {

    private oxclient: Analyticsclient;
    private param: TaskParameter;

    constructor() {
        this.oxclient = new Analyticsclient();
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
