import { Terraform as TerraformCommandHandlerAWS } from '../../../src/terraform';
import tl = require('azure-pipelines-task-lib');

let backend:any = "aws"
let provider:any = "s3"
let terraformCommandHandlerAWS: TerraformCommandHandlerAWS = new TerraformCommandHandlerAWS(backend, provider);

export async function run() {
    try {
        await terraformCommandHandlerAWS.validate();
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AWSValidateFailInvalidWorkingDirectoryL0 should have succeeded but failed with error.');
    }
}

run();