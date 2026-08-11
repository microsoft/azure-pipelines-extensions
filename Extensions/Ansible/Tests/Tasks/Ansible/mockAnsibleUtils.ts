import Q = require("q");

export const TestGuid: string = "7d9b7f32-41e5-43ed-8b0e-c6f2874836f8";

const DEFAULT_TOWER_HOST = "true dummy host";

interface MockState {
    platform: string;
    hasAnsible: boolean;
    sshSetupError: string;
    remoteCommandError: string;
    sameMachineCommandError: string;
    copyError: string;
    failRemoteOnStdErr: boolean;
    failAgentOnStdErr: boolean;
    fileExists: { [path: string]: boolean };
    directoryExists: { [path: string]: boolean };
    towerTemplateStatusCode: number;
    towerTemplateFound: boolean;
    towerLaunchStatusCode: number;
    towerJobStatusStatusCode: number;
    towerJobStatusSequence: string[];
    towerEventsPages: any[];
    towerEventsStatusCode: number;
}

let state: MockState = getDefaultState();

function getDefaultState(): MockState {
    return {
        platform: 'linux',
        hasAnsible: true,
        sshSetupError: "",
        remoteCommandError: "",
        sameMachineCommandError: "",
        copyError: "",
        failRemoteOnStdErr: false,
        failAgentOnStdErr: false,
        fileExists: {},
        directoryExists: {},
        towerTemplateStatusCode: 200,
        towerTemplateFound: true,
        towerLaunchStatusCode: 201,
        towerJobStatusStatusCode: 200,
        towerJobStatusSequence: ['successful'],
        towerEventsPages: [{
            count: 3,
            next: null,
            previous: null,
            results: [
                {
                    id: 5813,
                    type: "job_event",
                    job: 559,
                    counter: 2,
                    stdout: "Dummy stdout 2"
                },
                {
                    id: 5814,
                    type: "job_event",
                    job: 559,
                    counter: 1,
                    stdout: "Dummy stdout 1"
                },
                {
                    id: 5815,
                    type: "job_event",
                    job: 559,
                    counter: 3,
                    stdout: "Dummy stdout 3"
                }
            ]
        }],
        towerEventsStatusCode: 200
    };
}

    function normalizePathKey(value: string): string {
        return (value || '').replace(/\\/g, '/');
    }

function getTowerHost(): string {
    return process.env["ENDPOINT_URL_8b04f8a5-9a17-474d-836c-60c24edcfa50"] || DEFAULT_TOWER_HOST;
}

export function resetMockState(): void {
    state = getDefaultState();
}

export function setMockAgentPlatform(platform: string): void {
    state.platform = platform;
}

export function setMockAnsibleAvailable(isAvailable: boolean): void {
    state.hasAnsible = isAvailable;
}

export function setMockSshSetupError(message: string): void {
    state.sshSetupError = message;
}

export function setMockRemoteCommandError(message: string): void {
    state.remoteCommandError = message;
}

export function setMockSameMachineCommandError(message: string): void {
    state.sameMachineCommandError = message;
}

export function setMockCopyError(message: string): void {
    state.copyError = message;
}

export function setMockFailRemoteOnStdErr(shouldFail: boolean): void {
    state.failRemoteOnStdErr = shouldFail;
}

export function setMockFailAgentOnStdErr(shouldFail: boolean): void {
    state.failAgentOnStdErr = shouldFail;
}

export function setMockFileExists(path: string, exists: boolean): void {
    state.fileExists[normalizePathKey(path)] = exists;
}

export function setMockDirectoryExists(path: string, exists: boolean): void {
    state.directoryExists[normalizePathKey(path)] = exists;
}

export function setMockTowerTemplate(statusCode: number, found: boolean): void {
    state.towerTemplateStatusCode = statusCode;
    state.towerTemplateFound = found;
}

export function setMockTowerLaunchStatusCode(statusCode: number): void {
    state.towerLaunchStatusCode = statusCode;
}

export function setMockTowerStatusStatusCode(statusCode: number): void {
    state.towerJobStatusStatusCode = statusCode;
}

export function setMockTowerStatusSequence(sequence: string[]): void {
    state.towerJobStatusSequence = sequence && sequence.length > 0 ? sequence.slice(0) : ['successful'];
}

export function setMockTowerEventsPages(pages: any[]): void {
    state.towerEventsPages = pages && pages.length > 0 ? pages.slice(0) : [{ count: 0, next: null, previous: null, results: [] }];
}

export function setMockTowerEventsStatusCode(statusCode: number): void {
    state.towerEventsStatusCode = statusCode;
}

export function _writeLine(str) {
    console.log(str);
}

export class RemoteCommandOptions {
    public failOnStdErr : boolean;
}

export class DummyClient {
    constructor() {
        console.log("connection to dummy client established");
    }
    end() {
        console.log("connection to dummy client terminated");
    }
}

export function setupSshClientConnection(cfg) {
    var defer = Q.defer<any>();
    if (state.sshSetupError) {
        defer.reject(state.sshSetupError);
        return defer.promise;
    }
    var client = new this.DummyClient();
    defer.resolve(client);
    return defer.promise;
}

export function runCommandOnRemoteMachine(cmd: string, sshClient: any, options: RemoteCommandOptions) {
    var defer = Q.defer<string>();
    if (state.remoteCommandError) {
        defer.reject(state.remoteCommandError);
        return defer.promise;
    }

    if (state.failRemoteOnStdErr && options && options.failOnStdErr) {
        defer.reject("mock stderr from remote command");
        return defer.promise;
    }

    this._writeLine("[mock-remote-cmd] " + cmd);
    this._writeLine("cmd run on remote machine = " + cmd);
    defer.resolve("0");
    return defer.promise;
}

export function copyFileToRemoteMachine(scriptFile: string, dest: string, scpConfig: any): Q.Promise<string> {
    var defer = Q.defer<string>();
    if (state.copyError) {
        defer.reject(state.copyError);
        return defer.promise;
    }
    this._writeLine("[mock-copy] " + scriptFile + " -> " + dest);
    this._writeLine("copied file to remote machine = " + scriptFile);
    defer.resolve("0");
    return defer.promise;
}

export function runCommandOnSameMachine(cmd: string, options: RemoteCommandOptions) {
    var defer = Q.defer<string>();
    if (state.sameMachineCommandError) {
        defer.reject(state.sameMachineCommandError);
        return defer.promise;
    }

    if (state.failAgentOnStdErr && options && options.failOnStdErr) {
        defer.reject("mock stderr from agent command");
        return defer.promise;
    }

    this._writeLine("[mock-agent-cmd] " + cmd);
    this._writeLine("cmd run on agent machine = " + cmd);
    defer.resolve("0");
    return defer.promise;
}

export function testIfFileExist(filePath: string): boolean {
    var normalizedPath = normalizePathKey(filePath);
    if (state.fileExists.hasOwnProperty(normalizedPath)) {
        return state.fileExists[normalizedPath];
    }

    return true;
}

export function testIfDirectoryExist(directoryPath: string): boolean {
    var normalizedPath = normalizePathKey(directoryPath);
    if (state.directoryExists.hasOwnProperty(normalizedPath)) {
        return state.directoryExists[normalizedPath];
    }

    return true;
}

export function getAgentPlatform(): string {
    return state.platform;
}

export function getShellWhich(moduleName: string): string {
    return state.hasAnsible ? "somePath" : "";
}

export class WebResponse {
    public statusCode: number;
    public headers: any;
    public body: any;
    public statusMessage: string;
}

export class WebRequest {
    public method: string;
    public uri: string;
    public body: any;
    public headers: any;
}

export function beginRequest(request) {
    var res = new WebResponse();
    var host = getTowerHost();

    if (request.uri.indexOf('/job_templates/?name__exact=') >= 0) {
        res.statusCode = state.towerTemplateStatusCode;
        if (state.towerTemplateStatusCode === 200) {
            res.body = {
                count: state.towerTemplateFound ? 1 : 0,
                results: state.towerTemplateFound ? [{ id: 9, type: 'job_template', url: '/api/v1/job_templates/9/' }] : []
            };
        } else {
            res.statusMessage = "mock template error";
            res.body = {};
        }
        return res;
    }

    if (request.uri.indexOf('/job_templates/') >= 0 && request.uri.indexOf('/launch/') >= 0) {
        res.statusCode = state.towerLaunchStatusCode;
        if (state.towerLaunchStatusCode === 201) {
            res.body = { id: 559, type: 'job', url: '/api/v1/jobs/559/' };
        } else {
            res.statusMessage = "mock launch error";
            res.body = {};
        }
        return res;
    }

    if (request.uri.indexOf('/jobs/') >= 0 && request.uri.indexOf('/job_events/') < 0) {
        res.statusCode = state.towerJobStatusStatusCode;
        if (state.towerJobStatusStatusCode !== 200) {
            res.statusMessage = 'mock job status error';
            res.body = {};
            return res;
        }

        var nextStatus = state.towerJobStatusSequence.length > 0 ? state.towerJobStatusSequence.shift() : 'successful';
        res.body = {
            id: 559,
            type: 'job',
            url: '/api/v1/jobs/559/',
            status: nextStatus
        };
        return res;
    }

    if (request.uri.indexOf('/job_events/') >= 0) {
        res.statusCode = state.towerEventsStatusCode;
        if (state.towerEventsStatusCode !== 200) {
            res.statusMessage = "mock events error";
            res.body = {};
            return res;
        }

        var page = 1;
        var match = /[?&]page=(\d+)/.exec(request.uri);
        if (match && match[1]) {
            page = parseInt(match[1], 10);
        }

        var index = page - 1;
        var selectedPage = state.towerEventsPages[index] || { count: 0, next: null, previous: null, results: [] };
        var nextLink = selectedPage.next;

        if (nextLink === true) {
            nextLink = '/api/v1/jobs/559/job_events/?page_size=10&page=' + (page + 1);
        }

        if (typeof nextLink === 'string' && nextLink.indexOf('http') !== 0 && nextLink.indexOf('/') === 0) {
            selectedPage.next = nextLink;
        }

        res.body = {
            count: selectedPage.count || 0,
            next: selectedPage.next || null,
            previous: selectedPage.previous || null,
            results: selectedPage.results || []
        };
        return res;
    }

    res.statusCode = 404;
    res.statusMessage = "mock not found";
    res.body = {};
    this._writeLine('[mock-http-unknown] ' + request.uri + ' on ' + host);
    return res;
}

export function getTemporaryInventoryFilePath(): string {
    return '/tmp/' + TestGuid + 'inventory.ini';
}