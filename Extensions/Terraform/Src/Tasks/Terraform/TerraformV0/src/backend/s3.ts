import tasks = require('azure-pipelines-task-lib/task');
import {TFBackend} from './base';

export class TFBackendS3 extends TFBackend {
    constructor() { super(); }

    protected setupBackend(backendServiceName: string) {
        this.backendConfig.set('bucket', tasks.getInput("backendAWSBucketName", true));
        this.backendConfig.set('key', tasks.getInput("backendAWSKey", true));
        this.backendConfig.set('region', tasks.getEndpointAuthorizationParameter(backendServiceName, "region", true));
        this.backendConfig.set('access_key', tasks.getEndpointAuthorizationParameter(backendServiceName, "username", true));
        this.backendConfig.set('secret_key', tasks.getEndpointAuthorizationParameter(backendServiceName, "password", true));
    }
}