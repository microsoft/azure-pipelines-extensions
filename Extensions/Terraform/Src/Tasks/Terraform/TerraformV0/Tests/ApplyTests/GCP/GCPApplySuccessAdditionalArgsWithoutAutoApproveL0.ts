import { Terraform as TerraformCommandHandlerGCP } from '../../../src/terraform';
import tl = require('azure-pipelines-task-lib');

let backend:any = "gcp"
let provider:any = "gcp"
let terraformCommandHandlerGCP: TerraformCommandHandlerGCP = new TerraformCommandHandlerGCP(backend,provider);

export async function run() {
    try {
        const response = await terraformCommandHandlerGCP.onlyApply();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'GCPApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'GCPApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'GCPApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded but failed.');
    }
}

run();