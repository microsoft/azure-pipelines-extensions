import tl = require("vsts-task-lib/task");
import path = require("path");
import Q = require("q");
import util = require("util");
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

    public static getInstance(params: ansibleTaskParameters): ansibleCommandLineInterface {
        if (params.ansibleInterface == "remoteMachine") {
            return new ansibleRemoteMachineInterface(params);
        }
        if (params.ansibleInterface == 'agentMachine') {
            return new ansibleAgentMachineInterface(params);
        }
    }

    public async execute() {
        this.sshRun();
    }
    private async sshRun() {
        try {
            await this.setupConnection();
            var remoteCommand: string = 'ansible-playbook';
            var sudoEnabled: boolean = this._taskParameters.sudoEnable;
            var args: string = this._taskParameters.additionalParams;

            var failOnStdErr: boolean = this._taskParameters.failOnStdErr;
            this._remoteCmdOptions.failOnStdErr = failOnStdErr;

            remoteCommand = remoteCommand.concat(await this.buildPlaybookCommand());
            remoteCommand = remoteCommand.concat(await this.buildInventoryCommand());

            if (sudoEnabled == true) {

                let sudoUser = this._taskParameters.sudoUser;
                if (!sudoUser || sudoUser.trim() == "") {
                    sudoUser = 'root';
                }
                tl.debug('Sudo User = ' + sudoUser);
                remoteCommand = remoteCommand.concat(' -b --become-user ' + sudoUser);

            }

            if (args && args.trim()) {
                remoteCommand = remoteCommand.concat(' ' + args.trim());
            }

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

            this.terminateConnection();
        }
    }


    protected async buildPlaybookCommand(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            reject("Selected ansible interface not supported");
        });
    }

    protected async buildInventoryCommand(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            reject("Selected ansible interface not supported");
        });
    }

    protected async setupConnection() {
        throw "Selected ansible interface not supported";
    }

    protected terminateConnection() {
        throw "Selected ansible interface not supported";
    }

    protected async executeCommand(cmd: string) {
        throw "Selected ansible interface not supported";
    }

    protected _taskParameters: ansibleTaskParameters;
    protected _cleanupCmd = [];
    protected _remoteCmdOptions: RemoteCommandOptions;
}

export class ansibleRemoteMachineInterface extends ansibleCommandLineInterface {

    constructor(params: ansibleTaskParameters) {
        super(params);
        this._sshClientConnection = null;
        this._sshConfig = {};
    }

    protected async buildPlaybookCommand(): Promise<string> {
        var playbookSource: string = this._taskParameters.playbookSource;
        if (playbookSource == 'agentMachine') {

            let playbookFile = this._taskParameters.playbookPath;
            let playbookRoot = this._taskParameters.playbookRoot;
            if (!shell.test('-d', playbookRoot)) {
                throw tl.loc('PlaybookRootNotDirectory', playbookRoot);
            }

            if (!shell.test('-f', playbookFile)) {
                throw tl.loc('PlaybookNotPresent', path.basename(playbookFile), playbookRoot);
            }

            let remotePlaybookRoot = '/tmp/' + path.basename(playbookRoot);
            tl.debug('ansiblePlaybookRootPath = ' + '"' + remotePlaybookRoot + '"');

            let scpConfig = this._sshConfig || {};
            scpConfig.path = remotePlaybookRoot;
            tl.debug('Copying playbook to ansible machine.');

            await ansibleUtils.copyFileToRemoteMachine(playbookRoot, scpConfig);

            var remotePlaybookPath = remotePlaybookRoot + "/" + path.basename(playbookFile);

            this._cleanupCmd.push('rm -rf ' + remotePlaybookRoot);

        } else if (playbookSource == 'ansibleMachine') {

            var remotePlaybookPath = this._taskParameters.playbookPath;
            tl.debug('PlaybookPath = ' + '"' + remotePlaybookPath + '"');

        }
        return " " + remotePlaybookPath;

    }

    protected async buildInventoryCommand(): Promise<string> {
        var inventoryLocation = this._taskParameters.inventoryType;
        if (inventoryLocation == 'file') {

            let inventoryFileSource = this._taskParameters.inventoryFileSource;
            if (inventoryFileSource == 'agentMachine') {

                let inventoryFile: string = this._taskParameters.inventoryFilePath;

                if (!shell.test('-f', inventoryFile)) {
                    throw tl.loc('InventoryFileNotPresent', inventoryFile);
                }

                var remoteInventory = '/tmp/' + path.basename(inventoryFile);
                tl.debug('RemoteInventoryPath = ' + '"' + remoteInventory + '"');

                let scpConfig = this._sshConfig || {};
                scpConfig.path = remoteInventory;

                tl.debug('Copying Inventory file to ansible machine.');

                await ansibleUtils.copyFileToRemoteMachine(inventoryFile, scpConfig);

                this._cleanupCmd.push('rm -f ' + remoteInventory);

            } else if (inventoryFileSource == 'ansibleMachine') {
                var remoteInventory: string = this._taskParameters.inventoryFilePath;
                tl.debug('InventoryFile = ' + remoteInventory);
            }
            return ' -i ' + remoteInventory;

        } else if (inventoryLocation == 'hostList') {
            let hostList = this._taskParameters.inventoryHostList.trim();
            //host list should end with comma (,)
            if (!hostList.endsWith(','))
                hostList = hostList.concat(',');
            tl.debug("Host List = " + '"' + hostList + '"');
            return ' -i ' + '"' + hostList + '"';

        } else if (inventoryLocation == 'inlineContent') {

            let content = this._taskParameters.inventoryInline.trim();

            let remoteInventory = '/tmp/' + 'inventory.ini';
            let remoteInventoryPath = '"' + remoteInventory + '"';
            tl.debug('RemoteInventoryPath = ' + remoteInventoryPath);

            let inventoryCmd: string = 'echo ' + '"' + content + '"' + ' > ' + remoteInventory;
            await ansibleUtils.runCommandOnRemoteMachine(inventoryCmd, this._sshClientConnection, this._remoteCmdOptions);

            let dynamicInventory: boolean = this._taskParameters.inventoryDynamic;

            if (dynamicInventory == true) {
                await ansibleUtils.runCommandOnRemoteMachine('chmod +x ' + remoteInventory, this._sshClientConnection, this._remoteCmdOptions);
            }

            this._cleanupCmd.push('rm -f ' + remoteInventory);
            return ' -i ' + remoteInventory;
        }
    }

    protected async executeCommand(cmd: string) {
        await ansibleUtils.runCommandOnRemoteMachine(cmd, this._sshClientConnection, this._remoteCmdOptions);
    }

    protected async setupConnection() {
        //read SSH endpoint input
        var sshEndpoint = this._taskParameters.sshEndpoint;
        var username: string = tl.getEndpointAuthorizationParameter(sshEndpoint, 'username', false);
        var password: string = tl.getEndpointAuthorizationParameter(sshEndpoint, 'password', true); //passphrase is optional
        var privateKey: string = process.env['ENDPOINT_DATA_' + sshEndpoint + '_PRIVATEKEY']; //private key is optional, password can be used for connecting
        var hostname: string = tl.getEndpointDataParameter(sshEndpoint, 'host', false);
        var port: string = tl.getEndpointDataParameter(sshEndpoint, 'port', true); //port is optional, will use 22 as default port if not specified
        if (!port || port === '') {
            ansibleUtils._writeLine(tl.loc('UseDefaultPort'));
            port = '22';
        }

        //setup the SSH connection configuration based on endpoint details
        if (privateKey && privateKey !== '') {
            tl.debug('Using private key for ssh connection.');
            this._sshConfig = {
                host: hostname,
                port: port,
                username: username,
                privateKey: privateKey,
                passphrase: password
            }
        } else {
            //use password
            tl.debug('Using username and password for ssh connection.');
            this._sshConfig = {
                host: hostname,
                port: port,
                username: username,
                password: password
            }
        }

        //setup the SSH connection
        ansibleUtils._writeLine(tl.loc('SettingUpSshConnection', this._sshConfig.username, this._sshConfig.host, this._sshConfig.port));
        try {
            this._sshClientConnection = await ansibleUtils.setupSshClientConnection(this._sshConfig);
        } catch (err) {
            throw tl.TaskResult.Failed, tl.loc('ConnectionFailed', err);
        }
    }

    protected terminateConnection() {
        //close the client connection to halt build execution
        if (this._sshClientConnection) {
            tl.debug('Closing the SSH client connection.');
            this._sshClientConnection.end();
        }
    }

    private _sshClientConnection: any;
    private _sshConfig: any;
}

export class ansibleAgentMachineInterface extends ansibleCommandLineInterface {

    constructor(params: ansibleTaskParameters) {
        super(params);
    }

    protected async buildPlaybookCommand(): Promise<string> {
        var remotePlaybookPath = this._taskParameters.playbookPath;
        tl.debug('PlaybookPath = ' + '"' + remotePlaybookPath + '"');
        return " " + remotePlaybookPath;

    }

    protected async buildInventoryCommand(): Promise<string> {
        var inventoryLocation = this._taskParameters.inventoryType;
        
        if (inventoryLocation == 'file') {
            var remoteInventory: string = this._taskParameters.inventoryFilePath;
            tl.debug('InventoryFile = ' + remoteInventory);
            return ' -i ' + remoteInventory;
        } else if (inventoryLocation == 'hostList') {
            let hostList = this._taskParameters.inventoryHostList.trim();
            //host list should end with comma (,)
            if (!hostList.endsWith(','))
                hostList = hostList.concat(',');
            tl.debug("Host List = " + '"' + hostList + '"');
            return ' -i ' + '"' + hostList + '"';

        } else if (inventoryLocation == 'inlineContent') {

            let content = this._taskParameters.inventoryInline.trim();

            let remoteInventory = '/tmp/' + 'inventory.ini';
            let remoteInventoryPath = '"' + remoteInventory + '"';
            tl.debug('RemoteInventoryPath = ' + remoteInventoryPath);

            let inventoryCmd: string = 'echo ' + '"' + content + '"' + ' > ' + remoteInventory;
            await ansibleUtils.runCommandOnSameMachine(inventoryCmd, this._remoteCmdOptions);

            let dynamicInventory: boolean = this._taskParameters.inventoryDynamic;

            if (dynamicInventory == true) {
                await ansibleUtils.runCommandOnSameMachine('chmod +x ' + remoteInventory, this._remoteCmdOptions);
            }

            this._cleanupCmd.push('rm -f ' + remoteInventory);
            return ' -i ' + remoteInventory;
        }
    }

    protected async executeCommand(cmd: string) {
        await ansibleUtils.runCommandOnSameMachine(cmd, this._remoteCmdOptions);
    }

    protected async setupConnection() {
        if(os.platform() === 'win32') {
            throw tl.loc('AgentOnWindowsMachine');
        }
        if(!shell.which('ansible')) {
            throw tl.loc('AnisbleNotPresent');
        }
    }

    protected terminateConnection() {
    }
}