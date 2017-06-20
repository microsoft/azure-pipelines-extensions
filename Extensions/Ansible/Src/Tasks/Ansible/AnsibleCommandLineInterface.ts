import tl = require("vsts-task-lib/task");
import path = require("path");
import Q = require("q");
var os = require('os');
import { AnsibleInterface } from './AnsibleInterface';

var Ssh2Client = require('ssh2').Client;
var Scp2Client = require('scp2');

tl.setResourcePath(path.join(__dirname, "task.json"));

class RemoteCommandOptions {
    public failOnStdErr: boolean;
}

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
                this._writeLine(tl.loc('UseDefaultPort'));
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
            var runOptions: string = tl.getInput('cliRunOptions', true);
            var commands: string[];
            var scriptFile: string;
            var args: string;

            if (runOptions === 'commands') {
                commands = tl.getDelimitedInput('commands', '\n', true);
            } else {
                scriptFile = tl.getPathInput('scriptPath', true, true);
                args = tl.getInput('args')
            }

            var failOnStdErr: boolean = tl.getBoolInput('failOnStdErr');
            remoteCmdOptions.failOnStdErr = failOnStdErr;

            //setup the SSH connection
            this._writeLine(tl.loc('SettingUpSshConnection', sshConfig.username, sshConfig.host, sshConfig.port));
            try {
                sshClientConnection = await this.setupSshClientConnection(sshConfig);
            } catch (err) {
                tl.setResult(tl.TaskResult.Failed, tl.loc('ConnectionFailed', err));
            }

            if (sshClientConnection) {
                //SSH connection successful
                if (runOptions === 'commands') {
                    //run commands specified by the user
                    for (var i: number = 0; i < commands.length; i++) {
                        tl.debug('Running command ' + commands[i] + ' on remote machine.');
                        this._writeLine(commands[i]);
                        var returnCode: string = await this.runCommandOnRemoteMachine(
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
                    await this.copyScriptToRemoteMachine(scriptFile, scpConfig);

                    //set execute permissions on the script
                    tl.debug('Setting execute permisison on script copied to remote machine');
                    this._writeLine('chmod +x ' + remoteScriptPath);
                    await this.runCommandOnRemoteMachine(
                        'chmod +x ' + remoteScriptPath, sshClientConnection, remoteCmdOptions);

                    //run remote script file with args on the remote machine
                    var runScriptCmd = remoteScriptPath;
                    if (args) {
                        runScriptCmd = runScriptCmd.concat(' ' + args);
                    }

                    //setup command to clean up script file
                    cleanUpScriptCmd = 'rm -f ' + remoteScriptPath;

                    this._writeLine(runScriptCmd);
                    await this.runCommandOnRemoteMachine(
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
                    await this.runCommandOnRemoteMachine(
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

    /**
 * Uses scp2 to copy a file to remote machine
 * @param scriptFile
 * @param scpConfig
 * @returns {Promise<string>|Promise<T>}
 */
    private copyScriptToRemoteMachine(scriptFile: string, scpConfig: any): Q.Promise<string> {
        var defer = Q.defer<string>();

        Scp2Client.scp(scriptFile, scpConfig, (err) => {
            if (err) {
                defer.reject(tl.loc('RemoteCopyFailed', err));
            } else {
                tl.debug('Copied script file to remote machine at: ' + scpConfig.path);
                defer.resolve(scpConfig.path);
            }
        });

        return defer.promise;
    }

    /**
     * Sets up an SSH client connection, when promise is fulfilled, returns the connection object
     * @param sshConfig
     * @returns {Promise<any>|Promise<T>}
     */
    private setupSshClientConnection(sshConfig: any): Q.Promise<any> {
        var defer = Q.defer<any>();
        var client = new Ssh2Client();
        client.on('ready', () => {
            defer.resolve(client);
        }).on('error', (err) => {
            defer.reject(err);
        }).connect(sshConfig);
        return defer.promise;
    }

    /**
     * Runs command on remote machine and returns success or failure
     * @param command
     * @param sshClient
     * @param options
     * @returns {Promise<string>|Promise<T>}
     */
    private runCommandOnRemoteMachine(command: string, sshClient: any, options: RemoteCommandOptions): Q.Promise<string> {
        var defer = Q.defer<string>();
        var stdErrWritten: boolean = false;

        if (!options) {
            tl.debug('Options not passed to runCommandOnRemoteMachine, setting defaults.');
            var options = new RemoteCommandOptions();
            options.failOnStdErr = true;
        }

        var cmdToRun = command;
        if (cmdToRun.indexOf(';') > 0) {
            //multiple commands were passed separated by ;
            cmdToRun = cmdToRun.replace(/;/g, '\n');
        }
        tl.debug('cmdToRun = ' + cmdToRun);

        sshClient.exec(cmdToRun, (err, stream) => {
            if (err) {
                defer.reject(tl.loc('RemoteCmdExecutionErr', err))
            } else {
                stream.on('close', (code, signal) => {
                    tl.debug('code = ' + code + ', signal = ' + signal);

                    //based on the options decide whether to fail the build or not if data was written to STDERR
                    if (stdErrWritten === true && options.failOnStdErr === true) {
                        defer.reject(tl.loc('RemoteCmdExecutionErr'));
                    } else if (code && code != 0) {
                        defer.reject(tl.loc('RemoteCmdNonZeroExitCode', cmdToRun, code));
                    } else {
                        //success case - code is undefined or code is 0
                        defer.resolve('0');
                    }
                }).on('data', (data) => {
                    this._writeLine(data);
                }).stderr.on('data', (data) => {
                    stdErrWritten = true;
                    tl.debug('stderr = ' + data);
                    if (data && data.toString().trim() !== '') {
                        tl.error(data);
                    }
                });
            }
        });
        return defer.promise;
    }

    private _writeLine(str) : void {
        this._outStream.write(str + os.EOL);
    }

    private _outStream = process.stdout;

}