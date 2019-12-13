import tasks = require('azure-pipelines-task-lib/task');
import { TFProvider } from './base';

export class TFProviderAzureRM extends TFProvider {
    constructor() { super(); }

    public handleProvider(providerServiceName: string) {
        process.env['ARM_SUBSCRIPTION_ID'] = tasks.getEndpointDataParameter(providerServiceName, "subscriptionid", false);
        process.env['ARM_TENANT_ID'] = tasks.getEndpointAuthorizationParameter(providerServiceName, "tenantid", false);
        process.env['ARM_CLIENT_ID'] = tasks.getEndpointAuthorizationParameter(providerServiceName, "serviceprincipalid", false);
        process.env['ARM_CLIENT_SECRET'] = tasks.getEndpointAuthorizationParameter(providerServiceName, "serviceprincipalkey", false);
    }
}