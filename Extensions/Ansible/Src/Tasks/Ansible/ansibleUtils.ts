const fs = require('fs');
var os = require('os');
import http = require('http');
import querystring = require('querystring');
import util = require("util");

import tl = require("azure-pipelines-task-lib/task");
import httpClient = require('vso-node-api/HttpClient');
import ssh = require('ssh2');
import shell = require('shelljs');
import SftpClient = require('ssh2-sftp-client');
import Q = require("q");
var uuid = require('uuid/v4');

var httpObj = new httpClient.HttpCallbackClient(tl.getVariable("AZURE_HTTP_USER_AGENT")!);
const Ssh2Client = ssh.Client;

export function _writeLine(str: string): void {
    process.stdout.write(str + os.EOL);
}

export class RemoteCommandOptions {
    public failOnStdErr = false;
}

/**
 * Uses sftp to copy a file to remote machine
 * @param src
 * @param dest
 * @param sftpConfig
 * @returns {Promise<string>|Promise<T>}
 */
export async function copyFileToRemoteMachine(src: string, dest: string, sftpConfig: SftpClient.ConnectOptions): Promise<string> {
    var defer = Q.defer<string>();

    const sftpClient = new SftpClient();

    try {
        await sftpClient.connect(sftpConfig);

        // Upload
        const isDirectory = fs.lstatSync(src).isDirectory();

        if (isDirectory) {
            // Make sure the remote directory exists
            try {
                await sftpClient.mkdir(dest, true); // recursive = true
            } catch (err) {
                if (err.code !== 4 && !err.message.includes('Failure')) {
                    throw err;
                }
                // Check if directory really exists
                await sftpClient.stat(dest);
                console.log(`Remote directory exists: ${dest}`);
            }
            tl.debug(`Copying directory to remote machine at: ${dest}`);
            await sftpClient.uploadDir(src, dest);
            tl.debug(`Copied directory to remote machine at: ${dest}`);
        } else {
            tl.debug(`Copying file to remote machine at: ${dest}`);
            try {
                await sftpClient.put(src, dest);
            } catch (err) {
                console.error('PUT failed:', err.message);
            }
            tl.debug(`Copied file to remote machine at: ${dest}`);
        }

        defer.resolve('0');
    } catch (err) {
        defer.reject(tl.loc('RemoteCopyFailed', err));
    }

    try {
        sftpClient.on('error', (err) => {
            tl.debug(`sftpClient: Ignoring error diconnecting: ${err}`);
        }); // ignore logout errors - since there could be spontaneous ECONNRESET errors after logout; see: https://github.com/mscdex/node-imap/issues/695
        await sftpClient.end();
    } catch (err) {
        tl.debug(`Failed to close SFTP client: ${err}`);
    }

    return defer.promise;
}

/**
 * Sets up an SSH client connection, when promise is fulfilled, returns the connection object
 * @param sshConfig
 * @returns {Promise<any>|Promise<T>}
 */
export function setupSshClientConnection(sshConfig: any): Q.Promise<ssh.Client> {
    var defer = Q.defer<ssh.Client>();
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
export function runCommandOnRemoteMachine(command: string, sshClient: ssh.Client, options: RemoteCommandOptions): Q.Promise<string> {
    var defer = Q.defer<string>();
    var stdErrWritten: boolean = false;

    if (!options) {
        tl.debug('Options not passed to runCommandOnRemoteMachine, setting defaults.');
        var options = new RemoteCommandOptions();
        options.failOnStdErr = true;
    }

    var cmdToRun = command;
    tl.debug('cmdToRun = ' + cmdToRun);

    sshClient.exec(cmdToRun, (err, stream) => {
        if (err) {
            defer.reject(tl.loc('RemoteCmdExecutionErr', err))
        } else {
            stream.on('close', (code: string | number, signal: string) => {
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
            }).on('data', (data: string) => {
                _writeLine(data);
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

export function runCommandOnSameMachine(command: string, options: RemoteCommandOptions): Q.Promise<string> {
    var defer = Q.defer<string>();

    if (!options) {
        tl.debug('Options not passed to runCommandOnRemoteMachine, setting defaults.');
        var options = new RemoteCommandOptions();
        options.failOnStdErr = true;
    }

    var cmdToRun = command;
    tl.debug('cmdToRun = ' + cmdToRun);

    shell.exec(cmdToRun, (err, _stdout, stderr) => {
        if (err) {
            tl.debug('code = ' + err);
            defer.reject(tl.loc('RemoteCmdNonZeroExitCode', cmdToRun, err))
        } else {
            tl.debug('code = 0');
            if (stderr != '' && options.failOnStdErr === true) {
                defer.reject(tl.loc('RemoteCmdExecutionErr'));
            } else {
                defer.resolve('0');
            }
        }
    });
    return defer.promise;
}

export function testIfFileExist(filePath: string): boolean {
    return shell.test('-f', filePath)
}

export function testIfDirectoryExist(directoryPath: string): boolean {
    return shell.test('-d', directoryPath)
}

export function getAgentPlatform(): string {
    return os.platform();
}

export function getShellWhich(moduleName: string): string | null {
    return shell.which(moduleName);
}

export class WebRequest {
    public method: string;
    public uri: string;
    public body: any;
    public headers: any;
    constructor() {
        this.headers = {};
        this.body = querystring.stringify({});
        this.method = 'GET';
        this.uri = "";
    }
}

export class WebResponse<T> {
    public statusCode: number | undefined;
    public headers: http.IncomingHttpHeaders | undefined;
    public body: T | undefined;
    public statusMessage: string | undefined;
}

export async function beginRequest<T>(request: WebRequest): Promise<WebResponse<T>> {
    request.headers = request.headers || {};
    request.body = request.body || querystring.stringify({});
    return await beginRequestInternal(request);
}

function beginRequestInternal<T>(request: WebRequest): Promise<WebResponse<T>> {
    tl.debug(util.format("[%s]%s", request.method, request.uri));

    return new Promise<WebResponse<T>>((resolve, reject) => {
        httpObj.send(request.method, request.uri, request.body, request.headers, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                var httpResponse = toWebResponse<T>(response, body);
                resolve(httpResponse);
            }
        });
    });
}

export function getTemporaryInventoryFilePath(): string {
    return '/tmp/' + uuid() + 'inventory.ini';
}

function toWebResponse<T>(response: http.IncomingMessage | undefined, body: string | undefined): WebResponse<T> {
    var res = new WebResponse<T>();

    if (response) {
        res.statusCode = response.statusCode;
        res.headers = response.headers;
        res.statusMessage = response.statusMessage;

        if (body) {
            try {
                res.body = JSON.parse(body);
            } catch (error) {
                // @ts-ignore let's keep it as-is so far, but we should consider changing the type of body to string | T in the future
                res.body = body;
            }
        }
    }
    return res;
}