/// <reference path="../../../../../definitions/node.d.ts" /> 
/// <reference path="../../../../../definitions/vsts-task-lib.d.ts" /> 

import tl = require("vsts-task-lib/task");
import {AnsibleInterface}  from './AnsibleInterface';
import {AnsibleCommandLineInterface} from './AnsibleCommandLineInterface';
import {AnsibleTowerInterface} from './AnsibleTowerInterface';


export class AnsibleInterfaceFactory {
    public static GetAnsibleInterface(interfaceValue: string): AnsibleInterface {
        if (interfaceValue == "cli") {
            return new AnsibleCommandLineInterface();
        } else if (interfaceValue == "ansibleTower") {
            return new AnsibleTowerInterface();
        }
        return null;
    }
}

function run() {
    try {
        var ansibleInterface: AnsibleInterface = AnsibleInterfaceFactory.GetAnsibleInterface(tl.getInput("ansibleInterface", true));
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
