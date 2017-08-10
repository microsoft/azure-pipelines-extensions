import tl = require("vsts-task-lib/task");
import path = require("path");
import * as ansibleUtils from './ansibleUtils';
import { RemoteCommandOptions } from './ansibleUtils'
import { ansibleTaskParameters } from './ansibleTaskParameters';
import { ansibleCommandLineInterface } from './ansibleCommandLineInterface';

var os = require('os');
var shell = require('shelljs');

export class ansibleRemoteMachineInterface extends ansibleCommandLineInterface {

    constructor(params: ansibleTaskParameters) {
        super(params);
        this._sshClientConnection = null;
        this._sshConfig = {};
    }

    protected async _executeAnsiblePlaybook() {
        let playbookSource: string = this._taskParameters.playbookSource;
        let inventoryLocation: string = this._taskParameters.inventoryType;
        let inventoryFileSource: string = this._taskParameters.inventoryFileSource;
        if (playbookSource == 'agentMachine') {
            await this.copyPlaybookAndSetPathForAgentAsSource()
        }
        if (inventoryLocation == 'file' && inventoryFileSource == 'agentMachine') {
            await this.copyInventoryAndSetPathForAgentAsSource();
        }
        await super._executeAnsiblePlaybook();
    }

    private async copyPlaybookAndSetPathForAgentAsSource() {
        
        let playbookFile = this._taskParameters.playbookPath;
        let playbookRoot = this._taskParameters.playbookRoot;
        if (!ansibleUtils.testIfDirectoryExist(playbookRoot)) {
            throw tl.loc('PlaybookRootNotDirectory', playbookRoot);
        }
        if (!ansibleUtils.testIfFileExist(path.join(playbookRoot,playbookFile))) {
            throw tl.loc('PlaybookNotPresent', playbookFile, playbookRoot);
        }

        var remotePlaybookRoot = '/tmp/' + path.basename(playbookRoot);
        tl.debug('ansiblePlaybookRootPath = ' + '"' + remotePlaybookRoot + '"');

        let scpConfig = this._sshConfig || {};
        scpConfig.path = remotePlaybookRoot;
        tl.debug('Copying playbook to ansible machine.');
        this._playbookPath = remotePlaybookRoot + "/" + playbookFile;
        this._cleanupCmd.push('rm -rf ' + remotePlaybookRoot);
        await ansibleUtils.copyFileToRemoteMachine(playbookRoot, scpConfig);
    }

    private async copyInventoryAndSetPathForAgentAsSource() {
        let inventoryFile: string = this._taskParameters.inventoryFilePath;
        if (!ansibleUtils.testIfFileExist(inventoryFile)) {
            throw tl.loc('InventoryFileNotPresent', inventoryFile);
        }
        var remoteInventory = '/tmp/' + path.basename(inventoryFile);
        tl.debug('RemoteInventoryPath = ' + '"' + remoteInventory + '"');

        let scpConfig = this._sshConfig || {};
        scpConfig.path = remoteInventory;
        tl.debug('Copying Inventory file to ansible machine.');
        this._inventoryPath = remoteInventory;
        this._cleanupCmd.push('rm -f ' + remoteInventory);
        await ansibleUtils.copyFileToRemoteMachine(inventoryFile, scpConfig);
    }

    protected async executeCommand(cmd: string): Promise<string> {
        return await ansibleUtils.runCommandOnRemoteMachine(cmd, this._sshClientConnection, this._remoteCmdOptions);
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

