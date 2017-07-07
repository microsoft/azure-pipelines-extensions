import tl = require("vsts-task-lib/task");
import path = require("path");
import Q = require("q");
import { AnsibleInterface } from './AnsibleInterface';

import * as sshUtils from './sshutils';
import {RemoteCommandOptions} from './sshutils'

export class AnsibleCommandLineInterface extends AnsibleInterface {
    constructor(params) {
        super();
        this.taskParameter = params;
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
            var sshEndpoint = this.taskParameter.sshEndpoint;
            var username: string = this.taskParameter.username;
            var password: string = this.taskParameter.password;
            var privateKey: string = process.env['ENDPOINT_DATA_' + sshEndpoint + '_PRIVATEKEY']; //private key is optional, password can be used for connecting
            var hostname: string = this.taskParameter.hostname;
            var port: string = this.taskParameter.port; //port is optional, will use 22 as default port if not specified
            if (!port || port === '') {
                sshUtils._writeLine(tl.loc('UseDefaultPort'));
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

            //read the run options
            var runOptions: string = this.taskParameter.cliRunOptions;
            var commands: string[];
            var scriptFile: string;
            var args: string;

            if (runOptions === 'commands') {
                commands = this.taskParameter.commands;
            } else {
                scriptFile = this.taskParameter.scriptFile;
                args = this.taskParameter.scriptArgs;
            }

            var failOnStdErr: boolean = this.taskParameter.failOnStdErr;
            remoteCmdOptions.failOnStdErr = failOnStdErr;

            //setup the SSH connection
            sshUtils._writeLine(tl.loc('SettingUpSshConnection', sshConfig.username, sshConfig.host, sshConfig.port));
            try {
                sshClientConnection = await sshUtils.setupSshClientConnection(sshConfig);
            } catch (err) {
                tl.setResult(tl.TaskResult.Failed, tl.loc('ConnectionFailed', err));
            }
            if (sshClientConnection) {
                //SSH connection successful
                if (runOptions === 'commands') {
                    //run commands specified by the user
                    for (var i: number = 0; i < commands.length; i++) {
                        tl.debug('Running command ' + commands[i] + ' on remote machine.');
                        sshUtils._writeLine(commands[i]);
                        var returnCode: string = await sshUtils.runCommandOnRemoteMachine(
                            commands[i], sshClientConnection, remoteCmdOptions);
                        tl.debug('Command ' + commands[i] + ' completed with return code = ' + returnCode);
                    }
                } else if (runOptions === 'script') {
                    //setup script path on remote machine relative to user's $HOME directory
                    var remoteScript = './' + path.basename(scriptFile);
                    var remoteScriptPath = '"' + remoteScript + '"';
                    tl.debug('remoteScriptPath = ' + remoteScriptPath);

                    //copy script file to remote machine
                    var scpConfig = sshConfig;
                    scpConfig.path = remoteScript;
                    tl.debug('Copying script to remote machine.');
                    await sshUtils.copyScriptToRemoteMachine(scriptFile, scpConfig);

                    //set execute permissions on the script
                    tl.debug('Setting execute permisison on script copied to remote machine');
                    sshUtils._writeLine('chmod +x ' + remoteScriptPath);
                    await sshUtils.runCommandOnRemoteMachine(
                        'chmod +x ' + remoteScriptPath, sshClientConnection, remoteCmdOptions);

                    //run remote script file with args on the remote machine
                    var runScriptCmd = remoteScriptPath;
                    if (args) {
                        runScriptCmd = runScriptCmd.concat(' ' + args);
                    }

                    //setup command to clean up script file
                    cleanUpScriptCmd = 'rm -f ' + remoteScriptPath;

                    sshUtils._writeLine(runScriptCmd);
                    await sshUtils.runCommandOnRemoteMachine(
                        runScriptCmd, sshClientConnection, remoteCmdOptions);
                }
            }

        } catch (err) {
            tl.setResult(tl.TaskResult.Failed, err);
        } finally {
            //clean up script file if needed
            if (cleanUpScriptCmd) {
                try {
                    tl.debug('Deleting the script file copied to the remote machine.');
                    await sshUtils.runCommandOnRemoteMachine(
                        cleanUpScriptCmd, sshClientConnection, remoteCmdOptions);
                } catch (err) {
                    tl.warning(tl.loc('RemoteScriptFileCleanUpFailed', err));
                }
            }

            //close the client connection to halt build execution
            if (sshClientConnection) {
                tl.debug('Closing the SSH client connection.');
                sshClientConnection.end();
            }
        }
    }

    private taskParameter: any;
}