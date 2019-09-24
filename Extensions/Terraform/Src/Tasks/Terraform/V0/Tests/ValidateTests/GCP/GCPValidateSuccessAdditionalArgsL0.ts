import { TerraformCommandHandlerGCP } from './../../../src/gcp-terraform-command-handler';
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerGCP: TerraformCommandHandlerGCP = new TerraformCommandHandlerGCP();

export async function run() {
    try {
        const response = await terraformCommandHandlerGCP.validate();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'GCPValidateSuccessAdditionalArgsL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'GCPValidateSuccessAdditionalArgsL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'GCPValidateSuccessAdditionalArgsL0 should have succeeded but failed.');
    }
}

run();