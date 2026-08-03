import cp = require('child_process');
import crypto = require('crypto');
import fs = require('fs');
import os = require('os');
import http = require('http');
import querystring = require('querystring');
import util = require("util");

import tl = require("azure-pipelines-task-lib/task");
import ssh = require('ssh2');
import SftpClient = require('ssh2-sftp-client');
import httpClient = require('vso-node-api/HttpClient');

var httpObj = new httpClient.HttpCallbackClient(tl.getVariable("AZURE_HTTP_USER_AGENT")!);
const Ssh2Client = ssh.Client;

const CP_EXEC_OPTIONS: cp.ExecOptions = {
    maxBuffer: 20 * 1024 * 1024
};

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

        return '0';
    } catch (err) {
        throw tl.loc('RemoteCopyFailed', err);
    } finally {
        try {
            sftpClient.on('error', (err) => {
                tl.debug(`sftpClient: Ignoring error diconnecting: ${err}`);
            }); // ignore logout errors - since there could be spontaneous ECONNRESET errors after logout; see: https://github.com/mscdex/node-imap/issues/695
            await sftpClient.end();
        } catch (err) {
            tl.debug(`Failed to close SFTP client: ${err}`);
        }
    }
}

/**
 * Sets up an SSH client connection, when promise is fulfilled, returns the connection object
 * @param sshConfig
 * @returns {Promise<any>|Promise<T>}
 */
export function setupSshClientConnection(sshConfig: any): Promise<ssh.Client> {
    return new Promise<ssh.Client>((resolve, reject) => {
        const client = new Ssh2Client();
        client.on('ready', () => {
            resolve(client);
        }).on('error', (err) => {
            reject(err);
        }).connect(sshConfig);
    });
}

/**
 * Runs command on remote machine and returns success or failure
 * @param command
 * @param sshClient
 * @param options
 * @returns {Promise<string>|Promise<T>}
 */
export function runCommandOnRemoteMachine(command: string, sshClient: ssh.Client, options: RemoteCommandOptions): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let stdErrWritten: boolean = false;

        if (!options) {
            tl.debug('Options not passed to runCommandOnRemoteMachine, setting defaults.');
            options = new RemoteCommandOptions();
            options.failOnStdErr = true;
        }

        const cmdToRun = command;
        tl.debug('cmdToRun = ' + cmdToRun);

        sshClient.exec(cmdToRun, (err, stream) => {
            if (err) {
                reject(tl.loc('RemoteCmdExecutionErr', err))
            } else {
                stream.on('close', (code: string | number, signal: string) => {
                    tl.debug('code = ' + code + ', signal = ' + signal);

                    //based on the options decide whether to fail the build or not if data was written to STDERR
                    if (stdErrWritten === true && options.failOnStdErr === true) {
                        reject(tl.loc('RemoteCmdExecutionErr'));
                    } else if (code && code != 0) {
                        reject(tl.loc('RemoteCmdNonZeroExitCode', cmdToRun, code));
                    } else {
                        //success case - code is undefined or code is 0
                        resolve('0');
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
    });
}

export function runCommandOnSameMachine(command: string, options: RemoteCommandOptions): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (!options) {
            tl.debug('Options not passed to runCommandOnRemoteMachine, setting defaults.');
            options = new RemoteCommandOptions();
            options.failOnStdErr = true;
        }

        const cmdToRun = command;
        tl.debug('cmdToRun = ' + cmdToRun);

        cp.exec(cmdToRun, (err, _stdout, stderr) => {
            if (err) {
                tl.debug(`code = ${err.code}`);
                reject(tl.loc('RemoteCmdNonZeroExitCode', cmdToRun, err.code))
            } else {
                tl.debug('code = 0');
                if (stderr != '' && options.failOnStdErr === true) {
                    reject(tl.loc('RemoteCmdExecutionErr'));
                } else {
                    resolve('0');
                }
            }
        });
    });
}

export function testIfFileExist(filePath: string): boolean {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

export function testIfDirectoryExist(directoryPath: string): boolean {
    return fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory();
}

export function getAgentPlatform(): string {
    return os.platform();
}

export function getShellWhich(moduleName: string): string | null {
    return tl.which(moduleName, false);
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
    return '/tmp/' + crypto.randomUUID() + 'inventory.ini';
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