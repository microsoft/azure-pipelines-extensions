import tasks = require('azure-pipelines-task-lib/task');
import { Provider } from './base';
import { GoogleHelpers } from "../Helpers"

export class ProviderGoogle extends Provider {
    constructor() { super(); }

    public HandleProvider() {
        let jsonKeyFilePath = GoogleHelpers.GetJsonKeyFilePath(this.providerServiceName);
        process.env['GOOGLE_CREDENTIALS'] = `${jsonKeyFilePath}`;
        process.env['GOOGLE_PROJECT'] = tasks.getEndpointDataParameter(this.providerServiceName, "project", false);
    }
}