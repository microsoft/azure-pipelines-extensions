import tasks = require('azure-pipelines-task-lib/task');
import { TFProvider } from './base';
import { GoogleHelpers } from "../Helpers"

export class TFProviderGoogle extends TFProvider {
    constructor() { super(); }

    public HandleProvider() {
        let jsonKeyFilePath = GoogleHelpers.GetJsonKeyFilePath(this.providerServiceName);
        process.env['GOOGLE_CREDENTIALS'] = `${jsonKeyFilePath}`;
        process.env['GOOGLE_PROJECT'] = tasks.getEndpointDataParameter(this.providerServiceName, "project", false);
    }
}