import { TerraformCommandHandlerAzureRM } from './../../../src/azure-terraform-command-handler';
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerAzureRM: TerraformCommandHandlerAzureRM = new TerraformCommandHandlerAzureRM();

export async function run() {
    try {
        await terraformCommandHandlerAzureRM.onlyApply();
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AzureApplyFailEmptyWorkingDirectoryL0 should have succeeded but failed with error.');
    }
}

run();