import * as tl from 'azure-pipelines-task-lib';
import { RestClient, IRequestOptions } from 'typed-rest-client/RestClient';
import { ExpAuthorizer } from './expauthorizer';

export default class FeatureManager {
    constructor(serviceConnectionId: string, userAgent: string) {
        this._restClient = new RestClient(userAgent);
        this._expAuthorizer = new ExpAuthorizer(serviceConnectionId, userAgent);
    }

    public async createFeatureRollout(feature: any): Promise<void> {
        let requestUrl = `https://exp.microsoft.com/api/features`;
        let accessToken = await this._expAuthorizer.getAccessToken();
        let options: IRequestOptions = {
            additionalHeaders: {
                'authorization': `Bearer ${accessToken}`
            }
        };

        console.log(tl.loc('BeginFeatureRollout'));
        tl.debug(`[POST] ${requestUrl}`);
        let response = await this._restClient.create(requestUrl, feature, options);
        tl.debug(JSON.stringify(response));

        let featureId = response.result as string;
        
        requestUrl = `https://exp.microsoft.com/api/experiments/${featureId}/initialize`;
        
        tl.debug('Initialize feature rollout');
        tl.debug(`[POST] ${requestUrl}`);
        response = await this._restClient.create(requestUrl, null, options);
        tl.debug(JSON.stringify(response));

        console.log(tl.loc('FeatureRolloutComplete', featureId, featureId));
        tl.setVariable('FeatureId', featureId);
    }

    public async createProgression(featureId: string, progression): Promise<void> {
        let requestUrl = `https://exp.microsoft.com/api/features/${featureId}/progressions`;
        let accessToken = await this._expAuthorizer.getAccessToken();
        let options: IRequestOptions = {
            additionalHeaders: {
                'authorization': `Bearer ${accessToken}`
            }
        };

        console.log(tl.loc('BeginCreatingProgression'));
        tl.debug(`[POST] ${requestUrl}`);
        let response = await this._restClient.create(requestUrl, progression, options);
        tl.debug(JSON.stringify(response));

        let progressionId = response.result as string;
        console.log(tl.loc('ProgressionComplete', progressionId, featureId));
        tl.setVariable('ProgressionId', progressionId);
    }

    private _restClient: RestClient;
    private _expAuthorizer: ExpAuthorizer;
}