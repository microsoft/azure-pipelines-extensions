import tasks = require('azure-pipelines-task-lib/task');
import { TFBackend } from './base';
import { GoogleHelper } from "../GoogleKeyHelper"

export class TFBackendGCS extends TFBackend {
    constructor() { super(); }

    protected setupBackend(backendServiceName: string) {
        this.backendConfig.set('bucket', tasks.getInput("backendGCPBucketName", true));
        this.backendConfig.set('prefix', tasks.getInput("backendGCPPrefix", false));
        let jsonKeyFilePath = GoogleHelper.GetJsonKeyFilePath(backendServiceName);
        this.backendConfig.set('credentials', jsonKeyFilePath);
    }
}