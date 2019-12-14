import tasks = require('azure-pipelines-task-lib/task');
import { TFBackend } from './base';

export class TFBackendLocal extends TFBackend {
    constructor() { super(); }

    protected setupBackend(backendServiceName: string) {
        // Nothing to do here ...
    }
}