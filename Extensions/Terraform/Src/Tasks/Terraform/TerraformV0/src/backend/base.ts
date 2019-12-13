import {ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import tasks = require('azure-pipelines-task-lib/task');

export abstract class TFBackend {
    protected backendConfig: Map<string, string>;
    backendServiceName: String;

    protected abstract setupBackend(backendServiceName: String);
    constructor() {
        this.backendConfig = new Map<string, string>();
        this.backendServiceName = "backendService" + tasks.getInput("backend", true)
        this.setupBackend(this.backendServiceName);
    }

    public handleBackend(terraformToolRunner: ToolRunner): void {
        for (let [key, value] of this.backendConfig.entries()) {
            terraformToolRunner.arg(`-backend-config=${key}=${value}`);
        }
    }
}