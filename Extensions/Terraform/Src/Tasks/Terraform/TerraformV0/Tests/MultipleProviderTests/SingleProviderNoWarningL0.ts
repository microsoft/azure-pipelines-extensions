import { ToolCommands as TerraformCommandHandlerAzureRM } from '../../src/toolcmds';
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerAzureRM: TerraformCommandHandlerAzureRM = new TerraformCommandHandlerAzureRM();

export async function run() {
    try {
        await terraformCommandHandlerAzureRM.warnIfMultipleProviders();
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'SingleProviderNoWarningL0 should have succeeded but failed.');
    }
}

run();