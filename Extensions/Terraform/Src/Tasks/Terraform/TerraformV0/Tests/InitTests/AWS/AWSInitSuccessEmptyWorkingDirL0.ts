import { ToolCommands as TerraformCommandHandlerAWS } from '../../../src/toolcmds';
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerAWS: TerraformCommandHandlerAWS = new TerraformCommandHandlerAWS();

export async function run() {
    try {
        const response = await terraformCommandHandlerAWS.init();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'AWSInitSuccessEmptyWorkingDirL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'AWSInitSuccessEmptyWorkingDirL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AWSInitSuccessEmptyWorkingDirL0 should have succeeded but failed.');
    }
}

run();
