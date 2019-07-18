import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let tp = path.join(__dirname, './AzureInitSuccessNoAdditionalArgsL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

tr.setInput('provider', 'azurerm');
tr.setInput('command', 'init');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('commandOptions', '');

tr.setInput('backendServiceArm', 'AzureRM');
tr.setInput('backendAzureRmResourceGroupName', 'DummyResourceGroup');
tr.setInput('backendAzureRmStorageAccountName', 'DummyStorageAccount');
tr.setInput('backendAzureRmContainerName', 'DummyContainer');
tr.setInput('backendAzureRmKey', 'DummyKey');

process.env['ENDPOINT_AUTH_SCHEME_AzureRM'] = 'ServicePrincipal';
process.env['ENDPOINT_DATA_AzureRM_SUBSCRIPTIONID'] = 'DummmySubscriptionId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_SERVICEPRINCIPALID'] = 'DummyServicePrincipalId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_SERVICEPRINCIPALKEY'] = 'DummyServicePrincipalKey';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_TENANTID'] = 'DummyTenantId';

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    "which": {
        "terraform": "terraform"
    },
    "checkPath": {
        "terraform": true
    },
    "exec": {
        "terraform init -backend-config=storage_account_name=DummyStorageAccount -backend-config=container_name=DummyContainer -backend-config=key=DummyKey -backend-config=resource_group_name=DummyResourceGroup -backend-config=arm_subscription_id=DummmySubscriptionId -backend-config=arm_tenant_id=DummyTenantId -backend-config=arm_client_id=DummyServicePrincipalId -backend-config=arm_client_secret=DummyServicePrincipalKey": {
            "code": 0,
            "stdout": "Executed Successfully"
        }
    }
}

tr.setAnswers(a);

tr.run();