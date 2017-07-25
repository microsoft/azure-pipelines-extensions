import tl = require("vsts-task-lib/task");
import {ansibleCommandLineInterface} from './ansibleCommandLineInterface';
import * as ansibleUtils from './ansibleUtils';
import { RemoteCommandOptions } from './ansibleUtils'
import { ansibleTaskParameters } from './ansibleTaskParameters';

var os = require('os');
var shell = require('shelljs');

export class ansibleAgentMachineInterface extends ansibleCommandLineInterface {

    constructor(params: ansibleTaskParameters) {
        super(params);
    }

    public async execute() {
        try {
            if (os.platform() === 'win32') {
                throw tl.loc('AgentOnWindowsMachine');
            }
            if (!shell.which('ansible')) {
                throw tl.loc('AnisbleNotPresent');
            }

            let remoteCommand: string = 'ansible-playbook';

            let failOnStdErr: boolean = this._taskParameters.failOnStdErr;
            this._remoteCmdOptions.failOnStdErr = failOnStdErr;

            //remoteCommand = remoteCommand.concat(await this.buildPlaybookCommand());
            //remoteCommand = remoteCommand.concat(await this.buildInventoryCommand());
            let remotePlaybookPath = this._taskParameters.playbookPath;
            tl.debug('PlaybookPath = ' + '"' + remotePlaybookPath + '"');
            remoteCommand = remoteCommand.concat(" " + remotePlaybookPath);

            let inventoryLocation = this._taskParameters.inventoryType;

            if (inventoryLocation == 'file') {
                var remoteInventory: string = this._taskParameters.inventoryFilePath;
                tl.debug('InventoryFile = ' + remoteInventory);
                remoteCommand = remoteCommand.concat(' -i ' + remoteInventory);
            } else if (inventoryLocation == 'hostList') {
                remoteCommand = remoteCommand.concat(await this.getSufixForInventoryHostList());
            } else if (inventoryLocation == 'inlineContent') {
                remoteCommand = remoteCommand.concat(await this.getSufixForInventoryInline());
            }

            remoteCommand = remoteCommand.concat(await this.getSufixForSudoUser());
            remoteCommand = remoteCommand.concat(await this.getSufixForInventoryInline());

            tl.debug('Running ' + remoteCommand);

            await this.executeCommand(remoteCommand);
        } catch (err) {
            tl.setResult(tl.TaskResult.Failed, err);
        } finally {
            //clean up script file if needed
            if (this._cleanupCmd && this._cleanupCmd.length > 0) {
                try {
                    for (var i: number = 0; i < this._cleanupCmd.length; i++) {
                        await this.executeCommand(this._cleanupCmd[i]);
                    }
                } catch (err) {
                    tl.warning(tl.loc('RemoteFileCleanUpFailed', err));
                }
            }
        }
    }

    protected async executeCommand(cmd: string): Promise<string> {
        return await ansibleUtils.runCommandOnSameMachine(cmd, this._remoteCmdOptions);
    }
}