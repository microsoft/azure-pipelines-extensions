import { TerraformCommandHandlerGCP } from '../../../src/provider/google';
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerGCP: TerraformCommandHandlerGCP = new TerraformCommandHandlerGCP();

export async function run() {
    try {
        await terraformCommandHandlerGCP.onlyPlan();
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'GCPPlanFailInvalidWorkingDirectoryL0 should have succeeded but failed with error.');
    }
}

run();