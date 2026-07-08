import mockrun = require('azure-pipelines-task-lib/mock-run');
import path = require('path');
var Q = require('q');

let taskPath = path.join(__dirname, '../../../Src/Tasks/DownloadArtifactsBitbucket/downloadBitbucket.js');
let runner = new mockrun.TaskMockRunner(taskPath);

// Define secrets that should be masked
const secretToken = 'TestSecretToken456';

// Set task inputs
runner.setInput('connection', 'bitbucket-token-endpoint');
runner.setInput('definition', 'testuser/testrepo');
runner.setInput('branch', 'main');
runner.setInput('version', 'd83830a08974b961a85d3d79c3cbff75dd3fa9e6');
runner.setInput('downloadPath', '/tmp/bitbucket-download');

// Set environment variables for endpoint with the secret token
process.env["ENDPOINT_AUTH_SCHEME_bitbucket-token-endpoint"] = "Token";
process.env["ENDPOINT_AUTH_PARAMETER_bitbucket-token-endpoint_APITOKEN"] = secretToken;
process.env["ENDPOINT_AUTH_PARAMETER_bitbucket-token-endpoint_EMAIL"] = "test@example.com";
process.env["ENDPOINT_AUTH_bitbucket-token-endpoint"] = JSON.stringify({
    scheme: "Token",
    parameters: { apitoken: secretToken, email: "test@example.com" }
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

// Mock https
runner.registerMock('https', {
    request: function(options: any, callback: Function) {
        console.log('HTTPS request initiated');
        // Verify auth header is present but not logging plain text credentials
        if (options.headers && options.headers['Authorization']) {
            console.log('Authorization header set (value masked for security)');
        }
        var mockResponse = {
            statusCode: 200,
            statusMessage: 'OK',
            on: function(event: string, handler: Function) {
                if (event === 'data') {
                    process.nextTick(function() {
                        handler(JSON.stringify({
                            scm: 'git',
                            full_name: 'testuser/testrepo',
                            links: { clone: [{ href: 'https://bitbucket.org/testuser/testrepo.git', name: 'https' }] }
                        }));
                    });
                } else if (event === 'end') {
                    process.nextTick(function() { handler(); });
                }
            }
        };
        process.nextTick(function() { callback(mockResponse); });
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
            console.log('git clone called');
            var defer = Q.defer();
            defer.resolve(0);
            return defer.promise;
        };
        this.checkout = function(ref: string, options?: any) {
            console.log('git checkout called');
            var defer = Q.defer();
            defer.resolve(0);
            return defer.promise;
        };
    }
});

runner.run();
