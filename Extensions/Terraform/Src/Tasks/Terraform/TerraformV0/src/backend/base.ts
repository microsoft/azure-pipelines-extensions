import {ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import tasks = require('azure-pipelines-task-lib/task');

export abstract class Backend {
    protected backendConfig: Map<string, string>;
    backendServiceName: string;

    protected abstract setupBackend(backendServiceName: string);
    constructor() {
        this.backendConfig = new Map<string, string>();
        this.backendServiceName = "backendService" + tasks.getInput("backend", true)
        this.setupBackend(this.backendServiceName);
    }

    public HandleBackend(toolRunner: ToolRunner): void {
        for (let [key, value] of this.backendConfig.entries()) {
            toolRunner.arg(`-backend-config=${key}=${value}`);
        }
    }
}