import path = require("path");

import tl = require("azure-pipelines-task-lib/task");

import { ansibleCommandLineInterface } from './ansibleCommandLineInterface';
import { ansibleInterface } from './ansibleInterface';
import { ansibleRemoteMachineInterface } from './ansibleRemoteMachineInterface';
import { ansibleTaskParameters } from './ansibleTaskParameters';
import { ansibleTowerInterface } from './ansibleTowerInterface';

try {
    tl.setResourcePath(path.join(__dirname, "task.json"));
} catch (error) {
    tl.setResult(tl.TaskResult.Failed, error);
}

export const ansibleCommandLineInterfaceFactory = {
    getCommandLineInterface(params: ansibleTaskParameters): ansibleCommandLineInterface {
        if (params.ansibleInterface == "remoteMachine") {
            return new ansibleRemoteMachineInterface(params);
        } else {
            return new ansibleCommandLineInterface(params);
        }
    }
};

export const ansibleInterfaceFactory = {
    GetAnsibleInterface(params: ansibleTaskParameters): ansibleInterface {
        if (params.ansibleInterface != 'ansibleTower') {
            return ansibleCommandLineInterfaceFactory.getCommandLineInterface(params);
        } else {
            return new ansibleTowerInterface();
        }
    }
};

function run() {
    try {
        const params: ansibleTaskParameters = ansibleTaskParameters.getInstance();
        const ansibleInterface: ansibleInterface = ansibleInterfaceFactory.GetAnsibleInterface(params);

        if (ansibleInterface) {
            ansibleInterface.execute();
        } else {
            tl.setResult(tl.TaskResult.Failed, tl.loc("AnsibleInterfaceNotInitialized"));
        }
    } catch (error) {
        tl.setResult(tl.TaskResult.Failed, error);
    }
}

run();
