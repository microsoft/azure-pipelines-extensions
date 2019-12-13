import tasks = require('azure-pipelines-task-lib/task');
import { TFProvider } from './base';
import { GoogleHelper } from "../GoogleKeyHelper"

export class TFProviderGoogle extends TFProvider {
    constructor() { super(); }

    public handleProvider(providerServiceName: string) {
        let jsonKeyFilePath = GoogleHelper.GetJsonKeyFilePath(providerServiceName);
        process.env['GOOGLE_CREDENTIALS'] = `${jsonKeyFilePath}`;
        process.env['GOOGLE_PROJECT'] = tasks.getEndpointDataParameter(providerServiceName, "project", false);
    }
}