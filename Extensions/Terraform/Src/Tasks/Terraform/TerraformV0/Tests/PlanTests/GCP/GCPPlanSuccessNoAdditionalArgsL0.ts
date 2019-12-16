import { Terraform as TerraformCommandHandlerGCP } from '../../../src/terraform';
import tl = require('azure-pipelines-task-lib');

let backend:any = "gcp"
let provider:any = "gcp"
let terraformCommandHandlerGCP: TerraformCommandHandlerGCP = new TerraformCommandHandlerGCP(backend,provider);

export async function run() {
    try {
        const response = await terraformCommandHandlerGCP.onlyPlan();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'GCPPlanSuccessNoAdditionalArgsL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'GCPPlanSuccessNoAdditionalArgsL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'GCPPlanSuccessNoAdditionalArgsL0 should have succeeded but failed.');
    }
}

run();