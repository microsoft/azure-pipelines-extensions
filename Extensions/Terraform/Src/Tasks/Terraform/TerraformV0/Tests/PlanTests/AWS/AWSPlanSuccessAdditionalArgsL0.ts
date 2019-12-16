import { Terraform as TerraformCommandHandlerAWS } from '../../../src/terraform';
import tl = require('azure-pipelines-task-lib');

let backend:any = "aws"
let provider:any = "s3"
let terraformCommandHandlerAWS: TerraformCommandHandlerAWS = new TerraformCommandHandlerAWS(backend, provider);

export async function run() {
    try {
        const response = await terraformCommandHandlerAWS.onlyPlan();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'AWSPlanSuccessAdditionalArgsL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'AWSPlanSuccessAdditionalArgsL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AWSPlanSuccessAdditionalArgsL0 should have succeeded but failed.');
    }
}

run();