import * as tl from 'azure-pipelines-task-lib';
import { RestClient, IRequestOptions } from 'typed-rest-client/RestClient';
import { ExpAuthorizer } from './expauthorizer';

export enum ExperimentAction {
    Start,
    Advance,
    Stop
}

export default class ExperimentManager {
    constructor(serviceConnectionId: string, experimentId: string, userAgent: string) {
        this._restClient = new RestClient(userAgent);
        this._expAuthorizer = new ExpAuthorizer(serviceConnectionId, userAgent);
        this._experimentId = experimentId;
    }

    public async executeAction(action: ExperimentAction) {
        let url = `https://exp.microsoft.com/api/experiments/${this._experimentId}`;

        switch(action) {
            case ExperimentAction.Start: { url = `${url}/start`; break; }
            case ExperimentAction.Advance: { url = `${url}/advance`; break; }
            case ExperimentAction.Stop: { url = `${url}/stop`; break; }
        }

        let accessToken = await this._expAuthorizer.getAccessToken();
        let options: IRequestOptions = {
            additionalHeaders: {
                'authorization': `Bearer ${accessToken}`
            }
        };

        console.log(`Initiate action ${ExperimentAction[action]} on ${this._experimentId}`);
        tl.debug(`[POST] ${url}`);
        let response = await this._restClient.create(url, null, options);

        console.log(`Initiated action ${ExperimentAction[action]} on ${this._experimentId}`);
        tl.debug(JSON.stringify(response));
    }

    private _restClient: RestClient;
    private _expAuthorizer: ExpAuthorizer;
    private _experimentId: string;
}