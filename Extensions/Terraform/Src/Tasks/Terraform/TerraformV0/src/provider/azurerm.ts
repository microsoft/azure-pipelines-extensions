import tasks = require('azure-pipelines-task-lib/task');
import { TFProvider } from './base';

export class TFProviderAzureRM extends TFProvider {
    constructor() { super(); }

    public HandleProvider() {
        process.env['ARM_SUBSCRIPTION_ID'] = tasks.getEndpointDataParameter(this.providerServiceName, "subscriptionid", false);
        process.env['ARM_TENANT_ID'] = tasks.getEndpointAuthorizationParameter(this.providerServiceName, "tenantid", false);
        process.env['ARM_CLIENT_ID'] = tasks.getEndpointAuthorizationParameter(this.providerServiceName, "serviceprincipalid", false);
        process.env['ARM_CLIENT_SECRET'] = tasks.getEndpointAuthorizationParameter(this.providerServiceName, "serviceprincipalkey", false);
        process.env['ARM_ENVIRONMENT'] = tasks.getEndpointDataParameter(this.providerServiceName, "environment", false);
    }
}