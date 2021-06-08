import { TerraformCommandHandlerAWS } from './../../../src/aws-terraform-command-handler';
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerAWS: TerraformCommandHandlerAWS = new TerraformCommandHandlerAWS();

export async function run() {
    try {
        const response = await terraformCommandHandlerAWS.onlyApply();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'AWSApplySuccessNoAdditionalArgsL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'AWSApplySuccessNoAdditionalArgsL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AWSApplySuccessNoAdditionalArgsL0 should have succeeded but failed.');
    }
}

run();
