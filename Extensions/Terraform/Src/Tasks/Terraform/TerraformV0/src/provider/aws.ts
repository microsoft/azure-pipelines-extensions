import tasks = require('azure-pipelines-task-lib/task');
import { Provider } from './base';

export class ProviderAWS extends Provider {
    constructor() { super(); }

    public HandleProvider() {
        process.env['AWS_ACCESS_KEY_ID'] = tasks.getEndpointAuthorizationParameter(this.providerServiceName, "username", false);
        process.env['AWS_SECRET_ACCESS_KEY'] = tasks.getEndpointAuthorizationParameter(this.providerServiceName, "password", false);
    }
}