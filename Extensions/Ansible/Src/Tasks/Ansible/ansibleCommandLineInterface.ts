import tl = require("vsts-task-lib/task");
import path = require("path");
import Q = require("q");
var os = require('os');
import util = require("util");
import { AnsibleInterface } from './ansibleInterface';
import * as ansibleUtils from './ansibleUtils';
import {RemoteCommandOptions} from './ansibleUtils'

var Ssh2Client = require('ssh2').Client;
var Scp2Client = require('scp2');

tl.setResourcePath(path.join(__dirname, "task.json"));

export class AnsibleCommandLineInterface extends AnsibleInterface {
    constructor() {
        super();
    }

    public async execute() {
        this.sshRun();
    }
    private async sshRun() {
        var sshClientConnection: any;
        var cleanUpScriptCmd: string;
        var remoteCmdOptions: RemoteCommandOptions = new RemoteCommandOptions();

        try {
            //read SSH endpoint input
            var sshEndpoint = tl.getInput('connectionOverSsh', true);
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
            var sshConfig;
            if (privateKey && privateKey !== '') {
                tl.debug('Using private key for ssh connection.');
                sshConfig = {
                    host: hostname,
                    port: port,
                    username: username,
                    privateKey: privateKey,
                    passphrase: password
                }
            } else {
                //use password
                tl.debug('Using username and password for ssh connection.');
                sshConfig = {
                    host: hostname,
                    port: port,
                    username: username,
                    password: password
                }
            }

            var remoteCommand: string = 'ansible-playbook';
            var playbookSource: string = tl.getInput('playbookSource', true);
            var inventoryLocation: string = tl.getInput('inventories', true);
            var sudoEnabled: boolean = tl.getBoolInput('sudoEnabled', false);
            var args: string = tl.getInput('args', false);


            var failOnStdErr : boolean = tl.getBoolInput('failOnStdErr');
            remoteCmdOptions.failOnStdErr = failOnStdErr;

            var cleanupCmd: string[] = [];

            //setup the SSH connection
            ansibleUtils._writeLine(tl.loc('SettingUpSshConnection', sshConfig.username, sshConfig.host, sshConfig.port));
            try {
                sshClientConnection = await ansibleUtils.setupSshClientConnection(sshConfig);
            } catch (err) {
                tl.setResult(tl.TaskResult.Failed, tl.loc('ConnectionFailed', err));
            }

            if (sshClientConnection) {

                if (playbookSource == 'agentMachine') {

                    let playbookRoot: string = tl.getInput('playbookRoot', true);
                    let playbook: string = tl.getInput('playbookPathAgentMachine', true);

                    let remotePlaybookRoot = '/tmp/' + path.basename(playbookRoot);
                    let remotePlaybookRootPath = '"' + remotePlaybookRoot + '"';
                    tl.debug('ansiblePlaybookRootPath = ' + remotePlaybookRootPath);

                    let scpConfig = sshConfig;
                    scpConfig.path = remotePlaybookRoot;
                    tl.debug('Copying playbook to ansible machine.');
                    await ansibleUtils.copyFileToRemoteMachine(playbookRoot, scpConfig);

                    var remotePlaybookPath = remotePlaybookRoot + "/" + path.basename(playbook);

                    cleanupCmd.push('rm -rf ' + remotePlaybookRoot);

                } else if (playbookSource == 'ansibleMachine') {

                    var remotePlaybookPath = tl.getInput('playbookPathAnsibleMachine', true);
                    tl.debug('PlaybookPath = ' + remotePlaybookPath);

                }

                remoteCommand = remoteCommand.concat(" " + remotePlaybookPath);

                if (inventoryLocation == 'file') {

                    let inventoryFileSource = tl.getInput('inventoryFileSource', true);
                    if (inventoryFileSource == 'agentMachine') {

                        let inventoryFile: string = tl.getInput('inventoryFileAgentMachine', true);
                        var remoteInventory = '/tmp/' + path.basename(inventoryFile);
                        let remoteInventoryPath = '"' + remoteInventory + '"';
                        tl.debug('RemoteInventoryPath = ' + remoteInventoryPath);

                        let scpConfig = sshConfig;
                        scpConfig.path = remoteInventory;
                        tl.debug('Copying Inventory file to ansible machine.');
                        await ansibleUtils.copyFileToRemoteMachine(inventoryFile, scpConfig);

                        remoteCommand = remoteCommand.concat(' -i ' + remoteInventory);

                        cleanupCmd.push('rm -f ' + remoteInventory);

                    } else if (inventoryFileSource == 'ansibleMachine') {
                        var remoteInventory: string = tl.getInput('inventoryFileAnsibleMachine', true);
                        tl.debug('InventoryFile = ' + remoteInventory);
                    }
                    remoteCommand = remoteCommand.concat(' -i ' + remoteInventory);
                } else if (inventoryLocation == 'hostList') {

                    let hostList = tl.getInput('inventoryHostList', true).trim();
                    tl.debug("Host List = " + hostList);
                    remoteCommand = remoteCommand.concat(' -i ' + hostList);

                } else if (inventoryLocation == 'inlineContent') {

                    let content = tl.getInput('inventoryInlineContent', true).trim();

                    let remoteInventory = '/tmp/' + 'inventory.ini';
                    let remoteInventoryPath = '"' + remoteInventory + '"';
                    tl.debug('RemoteInventoryPath = ' + remoteInventoryPath);

                    let inventoryCmd: string = 'echo ' + '"' + content + '"' + ' > ' + remoteInventory;
                    await ansibleUtils.runCommandOnRemoteMachine(inventoryCmd, sshClientConnection, remoteCmdOptions);

                    let dynamicInventory: boolean = tl.getBoolInput('inventoryInlineDynamic', true);

                    if (dynamicInventory == true) {
                        await ansibleUtils.runCommandOnRemoteMachine('chmod +x ' + remoteInventory, sshClientConnection, remoteCmdOptions);
                    }

                    remoteCommand = remoteCommand.concat(' -i ' + remoteInventory);
                    cleanupCmd.push('rm -f ' + remoteInventory);

                }

                if (sudoEnabled == true) {

                    let sudoUser = tl.getInput('sudoUser', false);
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

                await ansibleUtils.runCommandOnRemoteMachine(remoteCommand, sshClientConnection, remoteCmdOptions);
            }
        } catch (err) {
            tl.setResult(tl.TaskResult.Failed, err);
        } finally {
            //clean up script file if needed
            if (cleanupCmd && cleanupCmd.length > 0) {
                try {
                    for (var i: number = 0; i < cleanupCmd.length; i++) {
                        await ansibleUtils.runCommandOnRemoteMachine(cleanupCmd[i], sshClientConnection, remoteCmdOptions);
                    }
                } catch (err) {
                    tl.warning(tl.loc('RemoteFileCleanUpFailed', err));
                }
            }

            //close the client connection to halt build execution
            if (sshClientConnection) {
                tl.debug('Closing the SSH client connection.');
                sshClientConnection.end();
            }
        }
    }
}