import { TerraformCommandHandlerAzureRM } from './../../../src/azure-terraform-command-handler';
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerAzureRM: TerraformCommandHandlerAzureRM = new TerraformCommandHandlerAzureRM();

export async function run() {
    try {
        const response = await terraformCommandHandlerAzureRM.validate();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'AzureValidateSuccessEmptyWorkingDirL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'AzureValidateSuccessEmptyWorkingDirL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AzureValidateSuccessEmptyWorkingDirL0 should have succeeded but failed.');
    }
}

run();