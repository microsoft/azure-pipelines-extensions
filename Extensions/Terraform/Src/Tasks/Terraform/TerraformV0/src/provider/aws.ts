import tasks = require('azure-pipelines-task-lib/task');
import { TFProvider } from './base';

export class TFProviderAWS extends TFProvider {
    constructor() { super(); }

    public handleProvider(providerServiceName: string) {
        process.env['AWS_ACCESS_KEY_ID'] = tasks.getEndpointAuthorizationParameter(providerServiceName, "username", false);
        process.env['AWS_SECRET_ACCESS_KEY'] = tasks.getEndpointAuthorizationParameter(providerServiceName, "password", false);
    }
}