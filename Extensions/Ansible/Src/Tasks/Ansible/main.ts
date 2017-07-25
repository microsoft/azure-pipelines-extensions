/// <reference path="../../../../../definitions/node.d.ts" /> 
/// <reference path="../../../../../definitions/vsts-task-lib.d.ts" /> 

import path = require("path");
import tl = require("vsts-task-lib/task");
import {ansibleInterface}  from './ansibleInterface';
import {ansibleCommandLineInterface} from './ansibleCommandLineInterface';
import {ansibleTowerInterface} from './ansibleTowerInterface';
import {ansibleTaskParameters} from './ansibleTaskParameters';

try {
tl.setResourcePath(path.join(__dirname, "task.json"));
} catch (error) {
    tl.setResult(tl.TaskResult.Failed, error);
}

export class AnsibleInterfaceFactory {
    public static GetAnsibleInterface(params: ansibleTaskParameters): ansibleInterface {
        if (params.ansibleInterface != 'ansibleTower') {
            return ansibleCommandLineInterface.getInstance(params);
        } else {
            return new ansibleTowerInterface();
        }
    }
}

function run() {
    try {
        var params:ansibleTaskParameters = ansibleTaskParameters.getInstance();
        var ansibleInterface: ansibleInterface = AnsibleInterfaceFactory.GetAnsibleInterface(params);
        if (ansibleInterface) {
            ansibleInterface.execute();
        } else {
            tl.setResult(tl.TaskResult.Failed, "");
        }
    } catch (error) {
        tl.setResult(tl.TaskResult.Failed, error);
    }
}


run();
