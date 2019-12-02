import * as tl from 'azure-pipelines-task-lib';
import { RestClient, IRequestOptions } from 'typed-rest-client/RestClient';
import { ExpAuthorizer } from './expauthorizer';

export default class FeatureManager {
    constructor(serviceConnectionId: string, userAgent: string) {
        this._restClient = new RestClient(userAgent);
        this._expAuthorizer = new ExpAuthorizer(serviceConnectionId, userAgent);
    }

    public async createFeatureRollout(feature: any): Promise<void> {
        // create an interface for feature
        let url = `https://exp.microsoft.com/api/features`;
        
        let accessToken = await this._expAuthorizer.getAccessToken();
        let options: IRequestOptions = {
            additionalHeaders: {
                'authorization': `Bearer ${accessToken}`
            }
        };

        console.log(`Begin creating feature rollout...`);
        tl.debug(`[POST] ${url}`);
        let response = await this._restClient.create(url, feature, options);

        console.log(JSON.stringify(response));
    }

    public async createProgression(featureId: string, progression): Promise<void> {
        // create an interface for progression
        let url = `https://exp.microsoft.com/api/features/${featureId}/progressions`;
        
        let accessToken = await this._expAuthorizer.getAccessToken();
        let options: IRequestOptions = {
            additionalHeaders: {
                'authorization': `Bearer ${accessToken}`
            }
        };

        console.log(`Begin creating progression...`);
        tl.debug(`[POST] ${url}`);
        let response = await this._restClient.create(url, progression, options);

        console.log(JSON.stringify(response));
    }

    private _restClient: RestClient;
    private _expAuthorizer: ExpAuthorizer;
}