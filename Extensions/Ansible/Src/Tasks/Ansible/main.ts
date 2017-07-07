/// <reference path="../../../../../definitions/node.d.ts" /> 
/// <reference path="../../../../../definitions/vsts-task-lib.d.ts" /> 

import path = require("path");
import tl = require("vsts-task-lib/task");
import {AnsibleInterface}  from './AnsibleInterface';
import {AnsibleCommandLineInterface} from './AnsibleCommandLineInterface';
import {AnsibleTowerInterface} from './AnsibleTowerInterface';
import {AnsibleParameters} from './AnsibleParameter';

try {
    tl.setResourcePath(path.join(__dirname, "task.json"));
} catch (error) {
    tl.setResult(tl.TaskResult.Failed, error);
}

export class AnsibleInterfaceFactory {
    public static GetAnsibleInterface(params: AnsibleParameters): AnsibleInterface {
        if (params.ansibleInterface == "cli") {
            return new AnsibleCommandLineInterface(params);
        } else if (params.ansibleInterface == "ansibleTower") {
            return new AnsibleTowerInterface(params);
        }
        return null;
    }
}

function run() {
    try {
        var taskParameter: AnsibleParameters = new AnsibleParameters;
        var ansibleInterface: AnsibleInterface = AnsibleInterfaceFactory.GetAnsibleInterface(taskParameter);
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
