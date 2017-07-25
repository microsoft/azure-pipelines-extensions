import tl = require("vsts-task-lib/task");
import { ansibleInterface } from './ansibleInterface';
import * as ansibleUtils from './ansibleUtils';
import { RemoteCommandOptions } from './ansibleUtils'
import { ansibleTaskParameters } from './ansibleTaskParameters';

var os = require('os');
var shell = require('shelljs');

export class ansibleCommandLineInterface extends ansibleInterface {
    constructor(params: ansibleTaskParameters) {
        super();
        this._taskParameters = params;
        this._remoteCmdOptions = new RemoteCommandOptions();
    }

    protected async executeCommand(cmd: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            reject("Selected ansible interface not supported");
        });
    }

    protected async getSufixForSudoUser(): Promise<string> {
        let sudoEnabled: boolean = this._taskParameters.sudoEnable;
        let sudoUser = this._taskParameters.sudoUser;
        return new Promise<string>((resolve, reject) => {
            if (sudoEnabled == true) {
                if (!sudoUser || sudoUser.trim() == "") {
                    sudoUser = 'root';
                }
                tl.debug('Sudo User = ' + sudoUser);
                resolve(' -b --become-user ' + sudoUser);
            } else {
                resolve("");
            }
        });
    }

    protected async getSufixForAdditionalParam(): Promise<string> {
        var args: string = this._taskParameters.additionalParams;
        return new Promise<string>((resolve, reject) => {
            if (args && args.trim()) {
                resolve(' ' + args.trim());
            } else {
                resolve("");
            }
        })
    }

    protected async getSufixForInventoryHostList(): Promise<string> {
        let hostList = this._taskParameters.inventoryHostList.trim();
        return new Promise<string>((resolve, reject) => {
            //host list should end with comma (,)
            if (!hostList.endsWith(','))
                hostList = hostList.concat(',');
            tl.debug("Host List = " + '"' + hostList + '"');
            resolve(' -i ' + '"' + hostList + '"');
        });
    }

    protected async getSufixForInventoryInline(): Promise<string> {
        let content = this._taskParameters.inventoryInline.trim();
        let dynamicInventory: boolean = this._taskParameters.inventoryDynamic;
        var __this = this;

        return new Promise<string>(async (resolve, reject) => {
            try {
                let remoteInventory = '/tmp/' + 'inventory.ini';
                let remoteInventoryPath = '"' + remoteInventory + '"';
                tl.debug('RemoteInventoryPath = ' + remoteInventoryPath);

                let inventoryCmd: string = 'echo ' + '"' + content + '"' + ' > ' + remoteInventory;
                await __this.executeCommand(inventoryCmd);
                if (dynamicInventory == true) {
                    await __this.executeCommand('chmod +x ' + remoteInventory);
                }
                this._cleanupCmd.push('rm -f ' + remoteInventory);
                resolve(' -i ' + remoteInventory);
            } catch (error) {
                reject(error);
            }
        });
    }

    protected _taskParameters: ansibleTaskParameters;
    protected _cleanupCmd = [];
    protected _remoteCmdOptions: RemoteCommandOptions;
}


