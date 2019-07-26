import tasks = require('azure-pipelines-task-lib/task');
import {ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformAuthorizationCommandInitializer} from './terraform-commands';
import {BaseTerraformCommandHandler} from './base-terraform-command-handler';

export class TerraformCommandHandlerAWS extends BaseTerraformCommandHandler {
    constructor() {
        super();
        this.providerName = "aws";
    }

    private setupBackend(backendServiceName: string) {
        this.backendConfig.set('bucket', tasks.getInput("backendAWSBucketName", true));
        this.backendConfig.set('key', tasks.getInput("backendAWSKey", true));
        this.backendConfig.set('region', tasks.getEndpointAuthorizationParameter(backendServiceName, "region", true));
        this.backendConfig.set('access_key', tasks.getEndpointAuthorizationParameter(backendServiceName, "username", true));
        this.backendConfig.set('secret_key', tasks.getEndpointAuthorizationParameter(backendServiceName, "password", true));
    }

    public handleBackend(terraformToolRunner: ToolRunner): void {
        let backendServiceName = tasks.getInput("backendServiceAWS", true);
        this.setupBackend(backendServiceName);

        for (let [key, value] of this.backendConfig.entries()) {
            terraformToolRunner.arg(`-backend-config=${key}=${value}`);
        }
    }

    public handleProvider(command: TerraformAuthorizationCommandInitializer) {
        if (command.serviceProvidername) {
            process.env['AWS_ACCESS_KEY_ID']  = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "username", false);
            process.env['AWS_SECRET_ACCESS_KEY']  = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "password", false);            
        }
    }
}