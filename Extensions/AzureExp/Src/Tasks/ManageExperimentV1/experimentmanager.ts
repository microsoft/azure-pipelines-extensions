import * as tl from 'azure-pipelines-task-lib';
import { RestClient, IRequestOptions } from 'typed-rest-client/RestClient';

import { ExpAuthorizer } from './expauthorizer';

export enum ExperimentAction {
    Start = "Start",
    Advance = "Advance",
    Stop = "Stop"
}

type ProgressionResult = {
    Id: string;
    Name: string;
    Studies: Array<{
        Id: string;
        Name: string;
        Description: string;
        Status: string;
        StartDate: Date;
        EndDate: Date;
    }>;
};

export default class ExperimentManager {
    constructor(featureId: string, progressionId: string, serviceConnectionId: string, userAgent: string) {
        this._restClient = new RestClient(userAgent);
        this._expAuthorizer = new ExpAuthorizer(serviceConnectionId, userAgent);
        this._featureId = featureId;
        this._progressionId = progressionId;
    }

    public async executeAction(experimentId: string, action: ExperimentAction): Promise<void> {
        let requestUrl = `https://exp.microsoft.com/api/experiments/${experimentId}`;
        let accessToken = await this._expAuthorizer.getAccessToken();
        let options: IRequestOptions = {
            additionalHeaders: {
                'authorization': `Bearer ${accessToken}`
            }
        };

        switch(action) {
            case ExperimentAction.Start: {
                requestUrl = `${requestUrl}/start`;
                break;
            }
            case ExperimentAction.Advance: {
                requestUrl = `${requestUrl}/advance`;
                break;
            }
            case ExperimentAction.Stop: {
                requestUrl = `${requestUrl}/stop`;
                break;
            }
            default: {
                throw new Error(tl.loc('InvalidAction', action));
            }
        }

        console.log(tl.loc('InitiateAction', ExperimentAction[action], experimentId));
        tl.debug(`[POST] ${requestUrl}`);
        let response = await this._restClient.create(requestUrl, null, options);
        console.log(tl.loc('InitiatedAction', ExperimentAction[action], experimentId));
        tl.debug(JSON.stringify(response));
    }

    public async getExperiment(experimentName: string): Promise<any> {
        let requestUrl = `https://exp.microsoft.com/api/features/${this._featureId}/progressions/${this._progressionId}`;
        let accessToken = await this._expAuthorizer.getAccessToken();
        let options: IRequestOptions = {
            additionalHeaders: {
                'authorization': `Bearer ${accessToken}`
            }
        };

        tl.debug(`[GET] ${requestUrl}`);
        let response = await this._restClient.get(requestUrl, options);
        tl.debug(JSON.stringify(response));

        let progression = response.result as ProgressionResult;
        let experiment = progression.Studies.find((e) => e.Name == experimentName);

        if (!experiment) {
            throw new Error(tl.loc('ExperimentNotFound', experimentName, this._progressionId));
        }

        tl.debug(`Experiment: ${JSON.stringify(experiment)}`);
        return experiment;
    }

    private _restClient: RestClient;
    private _expAuthorizer: ExpAuthorizer;
    private _featureId: string;
    private _progressionId: string;
}