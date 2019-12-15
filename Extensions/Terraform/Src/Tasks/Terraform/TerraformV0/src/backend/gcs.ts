import tasks = require('azure-pipelines-task-lib/task');
import { TFBackend } from './base';
import { GoogleHelpers } from "../Helpers"

export class TFBackendGCS extends TFBackend {
    constructor() { super(); }

    protected setupBackend(backendServiceName: string) {
        this.backendConfig.set('bucket', tasks.getInput("backendGCPBucketName", true));
        this.backendConfig.set('prefix', tasks.getInput("backendGCPPrefix", false));
        let jsonKeyFilePath = GoogleHelpers.GetJsonKeyFilePath(backendServiceName);
        this.backendConfig.set('credentials', jsonKeyFilePath);
    }
}