import { ToolCommands as TerraformCommandHandlerAWS } from '../../../src/toolcmds';
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerAWS: TerraformCommandHandlerAWS = new TerraformCommandHandlerAWS();

export async function run() {
    try {
        await terraformCommandHandlerAWS.init();
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AWSInitFailInvalidWorkingDirectoryL0 should have succeeded but failed.');
    }
}

run();
