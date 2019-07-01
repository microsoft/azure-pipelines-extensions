import * as hm from 'typed-rest-client/Handlers';
import * as restm from 'typed-rest-client/RestClient';
import * as tl from 'azure-pipelines-task-lib/task';
import {TaskParameter} from './../models/TaskParameter';
import {IVariation,IExperiment} from './../models/IOptimize';
import {GetExperimentUtil, UpdateExperimentUtil, Authorize} from './../models/GoogleOptimizeUtils'

let userAgent: string;
let url: string;

export class Optimizeclient {
	private param: TaskParameter;
	private endpointId: string;

	constructor() {
		this.param = TaskParameter.getInstance();
		this.endpointId = this.param.endpoint;
		url = tl.getEndpointUrl(this.endpointId, true);
		userAgent = "AzDevOps_GoogleOptimize";
	}

	public async updateExperiment < T extends IExperiment > (experiment: T) {
		Authorize(async function (err: any, token: any) {

			if(token == null) {
				console.log(tl.loc("AccessTokenGenerationFailed" , err));
				tl.setResult(tl.TaskResult.Failed, err);
			}

			const bearerHandler = new hm.BearerCredentialHandler(token);
			var restclient = new restm.RestClient(userAgent, url, [bearerHandler]);

			let currentExperiment = await GetExperimentUtil(restclient);

			if (currentExperiment.statusCode != 200) {
				console.log(tl.loc("FailedToFetchCurrentExperiment", JSON.stringify(currentExperiment.error)));
				tl.setResult(tl.TaskResult.Failed, err);
				throw tl.loc("FailedToFetchCurrentExperiment" ,currentExperiment.error );
			}

			if(currentExperiment.result.status === "ENDED"){
				console.log(tl.loc("UpdateFailed"));
				tl.setResult(tl.TaskResult.Failed, err);
				throw tl.loc("UpdateFailed");
			}

			let restRes = await UpdateExperimentUtil(restclient, experiment);
			tl.debug(`function: 'updateExperiment'. response: '${JSON.stringify(restRes)}'`);

			if (restRes.statusCode != 200) {
				tl.debug(`Unable to update experiment with Id: '${experiment.id}'. Response:`);
				tl.debug(JSON.stringify(restRes));
				console.log(tl.loc("FailedToUpdateExperiment", JSON.stringify(restRes)));
				tl.setResult(tl.TaskResult.Failed, JSON.stringify(restRes));
				throw tl.loc("FailedToUpdateExperiment", JSON.stringify(restRes));
			}
			console.log(tl.loc("ExperimentWithIdUpdatedSuccessfully", experiment.id));
		})
	}

}
