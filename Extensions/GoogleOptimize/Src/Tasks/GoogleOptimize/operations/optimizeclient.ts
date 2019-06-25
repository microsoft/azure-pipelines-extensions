import * as hm from 'typed-rest-client/Handlers';
import * as restm from 'typed-rest-client/RestClient';
import * as tl from 'azure-pipelines-task-lib/task';
import {TaskParameter} from './../models/TaskParameter';
import {IVariation, IExperiment} from './IOptimize';
import {JwtHandler} from './JwtHandler'
const request = require('request');
const qs = require('querystring');
const userAgent:string ;qs = require('querystring');

export class Optimizeclient{
	private jwthandler:JwtHandler;
	private param: TaskParameter;
	private endpointId: string;

	constructor(){
		this.jwthandler = new JwtHandler();
		this.param = new TaskParameter();
		this.endpointId = this.param.getEndpoint();
		url = tl.getEndpointUrl(this.endpointId, true);
		userAgent = "AzDevOps_GoogleOptimize";
	}

	public async updateExperiment<T extends IExperiment>( experiment: T , param : TaskParameter) {
        this.jwthandler.authorize(async function(err:any , token:any) {
            const bearerHandler = new hm.BearerCredentialHandler(token);
            var testclient = new restm.RestClient(userAgent, url, [bearerHandler]);
            let restRes = await testclient.update(`accounts/${param.getAccountId()}/webproperties/${param.getWebPropertyId()}/profiles/${param.getProfileId()}/experiments/${param.getExperimentId()}`, experiment);
            tl.debug(`function: 'updateExperiment'. response: '${JSON.stringify(restRes)}'`);

            if (restRes.statusCode != 200) {
                tl.debug(`Unable to update experiment with Id: '${experiment.id}'. Response:`);
                tl.debug(JSON.stringify(restRes));
                throw tl.loc("FailedToUpdatedExperiment", experiment.id);
            }
            console.log(tl.loc("ExperimentWithIdUpdatedSuccessfully", experiment.id));
        })
    }

    public async getExperiment<T extends IExperiment>(param: TaskParameter ): Promise<T> {
        this.jwthandler.authorize(async function(err:any, token:any) {
            const bearerHandler = new hm.BearerCredentialHandler(token);
            var testclient = new restm.RestClient(userAgent, url, [bearerHandler]);
            let restRes = await testclient.get<T>(`accounts/${param.getAccountId()}/webproperties/${param.getWebPropertyId()}/profiles/${param.getProfileId()}/experiments/${param.getExperimentId()}`);
            tl.debug(`function: 'getExperiment'. response: '${JSON.stringify(restRes)}'`);
            let experiment = restRes.result;
            return experiment;
        });
    }

}
