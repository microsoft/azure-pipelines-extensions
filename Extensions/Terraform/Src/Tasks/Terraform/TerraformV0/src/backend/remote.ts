import tasks = require('azure-pipelines-task-lib/task');
import {TFBackend} from './base';

export class TFBackendRemote extends TFBackend {
    constructor() { super(); }

    protected setupBackend(backendServiceName: string) {
        this.backendConfig.set('hostname', tasks.getInput("backendRemoteHostName", true));
        this.backendConfig.set('organization', tasks.getInput("backendRemoteOrganization", true));
        this.backendConfig.set('region', tasks.getEndpointAuthorizationParameter(backendServiceName, "region", true));
        this.backendConfig.set('access_key', tasks.getEndpointAuthorizationParameter(backendServiceName, "username", true));
        this.backendConfig.set('secret_key', tasks.getEndpointAuthorizationParameter(backendServiceName, "password", true));
    }
}