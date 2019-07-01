import {IVariation,IExperiment} from './../models/IOptimize';
import {Optimizeclient} from './optimizeclient'
import * as tl from 'azure-pipelines-task-lib/task';
import * as schema from './../models/Schema.json'
const fs = require('fs');

export class TaskOperation {

	private oxclient: Optimizeclient;

	constructor() {
		this.oxclient = new Optimizeclient();
	}

    public async stopExperiment(experiment: IExperiment): Promise < void > {
		experiment.status = "ENDED";
		await this.oxclient.updateExperiment(experiment);
	}

	public async updateExperiment(experiment: IExperiment): Promise < void > {
		experiment.status = "RUNNING";
		await this.oxclient.updateExperiment(experiment);
	}

}
