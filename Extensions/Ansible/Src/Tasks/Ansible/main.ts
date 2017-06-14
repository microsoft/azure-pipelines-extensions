/// <reference path="../../../../../definitions/node.d.ts" /> 
/// <reference path="../../../../../definitions/vsts-task-lib.d.ts" /> 
/// <reference path="../../../../../definitions/Q.d.ts" />

import tl = require("vsts-task-lib/task");
import path = require("path");
import querystring = require('querystring');
import Q = require("q");
import util = require("util");

import sshHelper = require('./ssh2helpers');
import { RemoteCommandOptions } from './ssh2helpers'

const  btoa  =  require('abab').btoa;

var httpClient = require('vso-node-api/HttpClient');
var httpObj = new httpClient.HttpCallbackClient(tl.getVariable("AZURE_HTTP_USER_AGENT"));

try {
    tl.setResourcePath(path.join(__dirname, "task.json"));
} catch (err) {
    tl.setResult(tl.TaskResult.Failed, tl.loc("TaskNotFound", err));
    process.exit();
}

class WebRequest {
    public method;
    public uri;
    public body;
    public headers;
}

class WebResponse {
    public statusCode;
    public headers;
    public body;
    public statusMessage;
}

class AnsibleTowerConstants {
    public static jobLaunchUrlFormat: string =  "%s/api/v1/job_templates/%s/launch/";
    public static jobUrlFormat: string = "%s/api/v1/jobs/%s/";
    public static jobEventUrlFormat: string = "%s/api/v1/jobs/%s/job_events/";
    public static jobTemplateIdUrlFormat: string = "%s/api/v1/job_templates/?name__exact=%s";
}

class AnsibleInterfaceFactory {
    public static GetAnsibleInterface(interfaceValue: string): AnsibleInterface {
        if (interfaceValue == "cli") {
            return new AnsibleCommandLineInterface();
        } else if (interfaceValue == "ansibleTower") {
            return new AnsibleTowerInterface();
        }
        return null;
    }
}

class AnsibleInterface {
    constructor() {
    }
    public execute(): void {
        throw "selected interface not supported";
    }
}

class AnsibleCommandLineInterface extends AnsibleInterface {
    constructor() {
        super();
    }

    public execute(): void {
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
                tl._writeLine(tl.loc('UseDefaultPort'));
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
            tl._writeLine(tl.loc('SettingUpSshConnection', sshConfig.username, sshConfig.host, sshConfig.port));
            try {
                sshClientConnection = await sshHelper.setupSshClientConnection(sshConfig);
            } catch (err) {
                tl.setResult(tl.TaskResult.Failed, tl.loc('ConnectionFailed', err));
            }

            if (sshClientConnection) {
                //SSH connection successful
                if (runOptions === 'commands') {
                    //run commands specified by the user
                    for (var i: number = 0; i < commands.length; i++) {
                        tl.debug('Running command ' + commands[i] + ' on remote machine.');
                        tl._writeLine(commands[i]);
                        var returnCode: string = await sshHelper.runCommandOnRemoteMachine(
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
                    await sshHelper.copyScriptToRemoteMachine(scriptFile, scpConfig);

                    //set execute permissions on the script
                    tl.debug('Setting execute permisison on script copied to remote machine');
                    tl._writeLine('chmod +x ' + remoteScriptPath);
                    await sshHelper.runCommandOnRemoteMachine(
                        'chmod +x ' + remoteScriptPath, sshClientConnection, remoteCmdOptions);

                    //run remote script file with args on the remote machine
                    var runScriptCmd = remoteScriptPath;
                    if (args) {
                        runScriptCmd = runScriptCmd.concat(' ' + args);
                    }

                    //setup command to clean up script file
                    cleanUpScriptCmd = 'rm -f ' + remoteScriptPath;

                    tl._writeLine(runScriptCmd);
                    await sshHelper.runCommandOnRemoteMachine(
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
                    await sshHelper.runCommandOnRemoteMachine(
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
}

class AnsibleTowerInterface extends AnsibleInterface {
    private _connectedService: string;
    private _jobTemplateName: string;
    private _jobTemplateId: string;
    private _username: string;
    private _password: string;
    private _hostname: string;
    private _jobTemplateIdPromise: Q.Promise<string>;
    private _lastPolledEvent: number;

    constructor() {
        super();
        this.InitializeTaskContants();
    }

    private InitializeTaskContants() {
        try {
            var connectedService = tl.getInput("connectionAnsibleTower", true);
            var endpointAuth = tl.getEndpointAuthorization(connectedService, true);
            this._username = endpointAuth.parameters["username"];
            this._password = endpointAuth.parameters["password"];
            this._hostname = tl.getEndpointUrl(connectedService, true);
            this._jobTemplateName = tl.getInput("jobTemplateName");
            this._lastPolledEvent = 0;

        } catch (error) {
            tl.setResult(tl.TaskResult.Failed, tl.loc("Ansible_ConstructorFailed", error.message));
        }
    }

    private GetRequestData(): string {
        return querystring.stringify({});
    }

    private GetBasicRequestHeader(): any {
        var requestHeader: any = {
            "Authorization": "Basic " + btoa(this._username + ":" + this._password)
        };
        return requestHeader;
    }

    private GetJobLaunchApi(): string {
        var ansibleJobLaunchUrl: string = util.format(AnsibleTowerConstants.jobLaunchUrlFormat, this._hostname, this._jobTemplateId);
        return ansibleJobLaunchUrl;
    }

    private GetJobApi(jobId: string): string {
        var ansibleJobUrl: string = util.format(AnsibleTowerConstants.jobUrlFormat, this._hostname, jobId);
        return ansibleJobUrl;
    }

    private GetJobEventApi(jobId: string): string {
        var ansibleJobEventUrl: string = util.format(AnsibleTowerConstants.jobEventUrlFormat, this._hostname, jobId);
        return ansibleJobEventUrl;
    }

    private async GetJobTemplateId(): Promise<string> {

        var jobTemplateId: string = null;
        var request = new WebRequest();
        request.method = 'GET';
        request.uri = util.format(AnsibleTowerConstants.jobTemplateIdUrlFormat, this._hostname, this._jobTemplateName);
        request.body = this.GetRequestData();

        var response = await this.beginRequest(request);
        if (response.statusCode === 200) {
            jobTemplateId = response.body['results'][0]['id'];
        } else {
            throw (tl.loc('JobTemplateNotPresent', this._jobTemplateName));
        }
        return jobTemplateId;
    }

    private async GetJobStatus(jobId: string): Promise<string> {
        var status: string = null;
        var request = new WebRequest();
        request.method = 'GET';
        request.uri = this.GetJobApi(jobId);
        request.body = this.GetRequestData();

        var response = await this.beginRequest(request);
        if (response.statusCode === 200) {
            status = response.body['status'];
        } else {
            throw (tl.loc('FailedToGetJobDetails', response.statusCode, response.statusMessage));
        }
        return status;
    }

    private async GetJobEvent(jobId: string): Promise<string[]> {
        var stdoutArray: string[] = [];
        var jobEventUrl = this.GetJobEventApi(jobId);
        var request = new WebRequest();
        request.method = 'GET';
        request.body = this.GetRequestData();

        while (jobEventUrl) {
            request.uri = jobEventUrl;
            var response = await this.beginRequest(request);
            if (response.statusCode === 200) {
                var totalEvents = response.body['count'];
                var results: any[] = response.body['results'];
                var nextPageUrl = response.body['next'];
                results.forEach((event) => {
                    stdoutArray[parseInt(event['counter'])] = event['stdout'];
                });
                jobEventUrl = (nextPageUrl != null) ? (this._hostname + nextPageUrl) : null;
            } else {
                throw (tl.loc('FailedToGetJobDetails', response.statusCode, response.statusMessage));
            }
        }

        return stdoutArray;
    }


    private IsJobInTerminalState(status: string): boolean {
        return status === 'successful' || status === 'failed';
    }

    private async UpdateRunningStatusAndLogs(jobId: string): Promise<string> {
        var waitTimeInSeconds = 10;
        var timeElapsed = 0;
        var longRunningJobThreshold = 300;
        var lastDisplayedEvent = 0;
        var status: string = "";
        while (true) {
            status = await this.GetJobStatus(jobId);
            if (status !== 'pending') {
                var events = await this.GetJobEvent(jobId);
                for (var counter = lastDisplayedEvent; counter <= events.length; ++counter) {
                    if (events[counter]) {
                        console.log(events[counter]);
                    }
                        
                }
                lastDisplayedEvent = counter;
            }
            if (this.IsJobInTerminalState(status)) {
                break;
            }

            await this.sleepFor(waitTimeInSeconds);

            timeElapsed += waitTimeInSeconds;
            if (timeElapsed >= longRunningJobThreshold) {
                waitTimeInSeconds = 120;
            }
        }

        return status;
    }

    private async LaunchJob(): Promise<string> {
        var jobId: string = null;
        var request = new WebRequest();
        request.method = 'POST';
        request.uri = this.GetJobLaunchApi();
        request.body = this.GetRequestData();

        var response = await this.beginRequest(request);

        if (response.statusCode === 201) {
            jobId = response.body['id'];
        } else {
            throw (tl.loc('CouldnotLaunchJob', response.statusCode, response.statusMessage));
        }
        return jobId;
    }

    public async execute() {
        try {
            this._jobTemplateId = await this.GetJobTemplateId();
            this.LaunchJob().then(async (jobId) => {
                var status = await this.UpdateRunningStatusAndLogs(jobId);
                if (status === 'successful')
                    tl.setResult(tl.TaskResult.Succeeded, "");
                else if (status === 'failed')
                    tl.setResult(tl.TaskResult.Failed, "");
            }, (error) => {
                tl.setResult(tl.TaskResult.Failed, error);
            });
        }
        catch (error) {
            tl.setResult(tl.TaskResult.Failed, error);
        }
    }


    public async beginRequest(request: WebRequest): Promise<WebResponse> {
        request.headers = request.headers || {};
        request.headers["Authorization"] = "Basic " + btoa(this._username + ":" + this._password);

        var httpResponse = await this.beginRequestInternal(request);
        return httpResponse;
    }

    private beginRequestInternal(request: WebRequest): Promise<WebResponse> {
        
        tl.debug(util.format("[%s]%s", request.method, request.uri));

        return new Promise<WebResponse>((resolve, reject) => {
            httpObj.send(request.method, request.uri, request.body, request.headers, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else {
                    var httpResponse = this.toWebResponse(response, body);
                    resolve(httpResponse);
                }
            });
        });
    }

    private sleepFor(sleepDurationInSeconds): Promise<any> {
        return new Promise((resolve, reeject) => {
            setTimeout(resolve, sleepDurationInSeconds * 1000);
        });
    }

    private toWebResponse(response, body): WebResponse {
        var res = new WebResponse();

        if (response) {
            res.statusCode = response.statusCode;
            res.headers = response.headers;
            res.statusMessage = response.statusMessage;
            if (body) {
                try {
                    res.body = JSON.parse(body);
                }
                catch (error) {
                    res.body = body;
                }
            }
        }
        return res;
    }

}

function run() {
    var ansibleInterface: AnsibleInterface = AnsibleInterfaceFactory.GetAnsibleInterface(tl.getInput("ansibleInterface", true));
    if (ansibleInterface) {
        ansibleInterface.execute();
    } else {
        tl.setResult(tl.TaskResult.Failed, "");
    }
}


run();
