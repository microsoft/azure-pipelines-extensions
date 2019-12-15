import tasks = require('azure-pipelines-task-lib/task');
import {TFBackend} from './base';

export class TFBackendAzureRM extends TFBackend {
    constructor() { super(); }

    protected setupBackend(backendServiceName: string) {
        this.backendConfig.set('storage_account_name', tasks.getInput("backendAzureRmStorageAccountName", true));
        this.backendConfig.set('container_name', tasks.getInput("backendAzureRmContainerName", true));
        this.backendConfig.set('key', tasks.getInput("backendAzureRmKey", true));
        this.backendConfig.set('resource_group_name', tasks.getInput("backendAzureRmResourceGroupName", true));
        this.backendConfig.set('arm_subscription_id', tasks.getEndpointDataParameter(backendServiceName, "subscriptionid", true));
        this.backendConfig.set('arm_tenant_id', tasks.getEndpointAuthorizationParameter(backendServiceName, "tenantid", true));
        this.backendConfig.set('arm_client_id', tasks.getEndpointAuthorizationParameter(backendServiceName, "serviceprincipalid", true));
        this.backendConfig.set('arm_client_secret', tasks.getEndpointAuthorizationParameter(backendServiceName, "serviceprincipalkey", true));
        this.backendConfig.set('arm_environment', tasks.getEndpointDataParameter(backendServiceName, "environment", true));
    }
}