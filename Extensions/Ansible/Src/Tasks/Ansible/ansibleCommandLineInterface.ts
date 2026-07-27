import tl = require("azure-pipelines-task-lib/task");
// @ts-ignore there is no type definition for shell-quote
import { quote } from 'shell-quote';

import { ansibleInterface } from './ansibleInterface';
import * as ansibleUtils from './ansibleUtils';
import { ansibleTaskParameters } from './ansibleTaskParameters';

export class ansibleCommandLineInterface extends ansibleInterface {
    constructor(params: ansibleTaskParameters) {
        super();
        this._taskParameters = params;
        this._remoteCmdOptions = new ansibleUtils.RemoteCommandOptions();
        this._additionalParams = "";
        this._cleanupCmd = [];
        this._playbookPath = "";
        this._inventoryPath = "";
        this._sudoUser = "";
    }

    public async execute() {
        try {
            await this.setupConnection();
            const failOnStdErr = this._taskParameters.failOnStdErr;
            this._remoteCmdOptions.failOnStdErr = failOnStdErr;

            await this._executeAnsiblePlaybook();
        } catch (error) {
            tl.setResult(tl.TaskResult.Failed, error);
        } finally {
            //clean up script file if needed
            if (this._cleanupCmd && this._cleanupCmd.length > 0) {
                try {
                    for (let i = 0; i < this._cleanupCmd.length; i++) {
                        await this.executeCommand(this._cleanupCmd[i]!);
                    }
                } catch (err) {
                    tl.warning(tl.loc('RemoteFileCleanUpFailed', err));
                }
            }
            this.terminateConnection();
        }
    }

    protected async _executeAnsiblePlaybook() {
        if (this._playbookPath == null || this._playbookPath.trim() == "") {
            this._playbookPath = this._taskParameters.playbookPath;
        }

        tl.debug('PlaybookPath = ' + '"' + this._playbookPath + '"');

        if (this._inventoryPath == null || this._inventoryPath.trim() == "") {
            const inventoryLocation = this._taskParameters.inventoryType;

            if (inventoryLocation == 'file') {
                this._inventoryPath = this._taskParameters.inventoryFilePath;
            } else if (inventoryLocation == 'hostList') {
                this._inventoryPath = await this.getInventoryPathForHostList();
            } else if (inventoryLocation == 'inlineContent') {
                this._inventoryPath = await this.createAndGetInventoryPathForInline();
            }
        }

        tl.debug('InventoryFile = ' + this._inventoryPath);
        this._sudoUser = await this.getSudoUser();
        this._additionalParams = await this.getAdditionalParam();

        const playbookExecCmd = this._buildPlaybookExecutionCommand();
        tl.debug('Running ' + playbookExecCmd);

        await this.executeCommand(playbookExecCmd);
    }

    protected async setupConnection() {
        if (ansibleUtils.getAgentPlatform() === 'win32') {
            throw tl.loc('AgentOnWindowsMachine');
        }

        if (!ansibleUtils.getShellWhich('ansible')) {
            throw tl.loc('AnisbleNotPresent');
        }
    }

    protected terminateConnection() { }

    protected async executeCommand(cmd: string): Promise<string> {
        return await ansibleUtils.runCommandOnSameMachine(cmd, this._remoteCmdOptions);
    }

    protected async getSudoUser(): Promise<string> {
        const sudoEnabled = this._taskParameters.sudoEnable;
        let sudoUser = this._taskParameters.sudoUser;

        return new Promise<string>((resolve) => {
            if (sudoEnabled == true) {
                if (!sudoUser || sudoUser.trim() == "") {
                    sudoUser = 'root';
                }

                tl.debug('Sudo User = ' + sudoUser);
                resolve(sudoUser);
            } else {
                resolve("");
            }
        });
    }

    protected async getAdditionalParam(): Promise<string> {
        const args = this._taskParameters.additionalParams;

        return new Promise<string>((resolve) => {
            if (args && args.trim()) {
                resolve(args.trim());
            } else {
                resolve("");
            }
        })
    }

    protected async getInventoryPathForHostList(): Promise<string> {
        let hostList = this._taskParameters.inventoryHostList.trim();

        return new Promise<string>((resolve, reject) => {
            //host list should end with comma (,)
            if (!hostList.endsWith(','))
                hostList = hostList.concat(',');
            tl.debug("Host List = " + '"' + hostList + '"');
            resolve('"' + hostList + '"');
        });
    }

    protected async createAndGetInventoryPathForInline(): Promise<string> {
        const content = this._taskParameters.inventoryInline.trim();
        const dynamicInventory = this._taskParameters.inventoryDynamic;
        const __this = this;

        return new Promise<string>(async (resolve, reject) => {
            try {
                const remoteInventory = ansibleUtils.getTemporaryInventoryFilePath();
                const remoteInventoryPath = '"' + remoteInventory + '"';
                tl.debug('RemoteInventoryPath = ' + remoteInventoryPath);

                const inventoryCmd = 'echo ' + quote([content]) + ' > ' + remoteInventory;
                await __this.executeCommand(inventoryCmd);

                if (dynamicInventory == true) {
                    await __this.executeCommand('chmod +x ' + remoteInventory);
                }

                this._cleanupCmd.push('rm -f ' + remoteInventory);
                resolve(remoteInventory);
            } catch (error) {
                reject(error);
            }
        });
    }

    private _buildPlaybookExecutionCommand() {
        let cmd = 'ansible-playbook ';

        if (this._inventoryPath && this._inventoryPath.trim()) {
            cmd = cmd.concat('-i ' + this._inventoryPath + ' ');
        }

        if (this._playbookPath && this._playbookPath.trim()) {
            cmd = cmd.concat(this._playbookPath + " ");
        }

        if (this._sudoUser && this._sudoUser.trim()) {
            cmd = cmd.concat('-b --become-user ' + this._sudoUser + ' ');
        }

        if (this._additionalParams && this._additionalParams.trim()) {
            cmd = cmd.concat(this._additionalParams);
        }

        return cmd;
    }

    protected _taskParameters: ansibleTaskParameters;
    protected _cleanupCmd: string[] = [];
    protected _remoteCmdOptions: ansibleUtils.RemoteCommandOptions;
    protected _playbookPath: string;
    protected _inventoryPath: string;
    private _sudoUser: string;
    private _additionalParams: string;
}