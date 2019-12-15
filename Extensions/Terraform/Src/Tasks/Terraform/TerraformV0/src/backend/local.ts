import tasks = require('azure-pipelines-task-lib/task');
import { Backend } from './base';

export class BackendLocal extends Backend {
    constructor() { super(); }

    protected setupBackend(backendServiceName: string) {
        // Nothing to do here ...
    }
}