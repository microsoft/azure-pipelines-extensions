import mockrun = require('azure-pipelines-task-lib/mock-run');
import path = require('path');
var Q = require('q');

let taskPath = path.join(__dirname, '../../../Src/Tasks/DownloadArtifactsBitbucket/downloadBitbucket.js');
let runner = new mockrun.TaskMockRunner(taskPath);

// Set task inputs
runner.setInput('connection', 'bitbucket-oauth-endpoint');
runner.setInput('definition', 'testuser/testrepo');
runner.setInput('branch', 'main');
runner.setInput('version', 'd83830a08974b961a85d3d79c3cbff75dd3fa9e6');
runner.setInput('downloadPath', '/tmp/bitbucket-download');

// Set environment variables for endpoint with unsupported OAuth scheme
process.env["ENDPOINT_AUTH_SCHEME_bitbucket-oauth-endpoint"] = "OAuth";
process.env["ENDPOINT_AUTH_PARAMETER_bitbucket-oauth-endpoint_ACCESSTOKEN"] = "some-oauth-token";
process.env["ENDPOINT_AUTH_bitbucket-oauth-endpoint"] = JSON.stringify({
    scheme: "OAuth",
    parameters: { accesstoken: "some-oauth-token" }
});

// Register mocks
runner.registerMock('azure-pipelines-task-lib/task', require('azure-pipelines-task-lib/mock-task'));

// Mock shelljs
runner.registerMock('shelljs', {
    rm: function(flags: string, path: string) { console.log('shell.rm ' + flags + ' ' + path); },
    cd: function(path: string) { console.log('shell.cd ' + path); },
    error: function() { return null; },
    which: function(tool: string) { return '/usr/bin/' + tool; }
});

// Mock https - should not be called as auth should fail first
runner.registerMock('https', {
    request: function(options: any, callback: Function) {
        console.log('HTTPS request - should not reach here with unsupported auth');
        return { end: function() {}, on: function() { return this; } };
    }
});

// Mock sourcecontrolwrapper
runner.registerMock('./sourcecontrolwrapper.js', {
    SourceControlWrapper: function(toolType: string) {
        this.toolType = toolType;
        this.username = '';
        this.password = '';
        this.on = function() {};
        this.clone = function(repo: string, progress: boolean, folder: string, options: any) {
            var defer = Q.defer();
            defer.resolve(0);
            return defer.promise;
        };
        this.checkout = function(ref: string, options?: any) {
            var defer = Q.defer();
            defer.resolve(0);
            return defer.promise;
        };
    }
});

runner.run();
