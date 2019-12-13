import tl = require('azure-pipelines-task-lib/task');
import {ParentCommandHandler} from './parent-handler';
import path = require('path');

async function run() {
    tl.setResourcePath(path.join(__dirname, '..', 'task.json'));

    let parentHandler = new ParentCommandHandler();
    try {
        await parentHandler.execute(tl.getInput("provider", true), tl.getInput("command", true));
        tl.setResult(tl.TaskResult.Succeeded, "");
    } catch (error) {
        tl.setResult(tl.TaskResult.Failed, error.message);
    }
}

run();