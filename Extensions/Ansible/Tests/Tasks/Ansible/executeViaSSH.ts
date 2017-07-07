import mockanswer = require('vsts-task-lib/mock-answer');
import mockrun = require('vsts-task-lib/mock-run');
import path = require('path');
import Q = require("q");

let taskPath = path.join(__dirname, '../../../Src/Tasks/Ansible/main.js');
let runner = new mockrun.TaskMockRunner(taskPath);
runner.setInput('ansibleInterface', 'cli');
runner.setInput('connectionOverSsh', '8b04f8a5-9a17-474d-836c-60c24edcfa50');
runner.setInput('cliRunOptions', 'commands');
runner.setInput('commands', "dummy command");
runner.setInput('failOnStdError', "true");

process.env["AZURE_HTTP_USER_AGENT"] = "TFS_useragent";
process.env["ENDPOINT_AUTH_PARAMETER_8b04f8a5-9a17-474d-836c-60c24edcfa50_USERNAME"] = "DummyUser";
process.env["ENDPOINT_AUTH_PARAMETER_8b04f8a5-9a17-474d-836c-60c24edcfa50_PASSWORD"] = "DummyPassword";
process.env["ENDPOINT_DATA_8b04f8a5-9a17-474d-836c-60c24edcfa50_HOST"] = "10.171.133.59";
process.env["ENDPOINT_DATA_8b04f8a5-9a17-474d-836c-60c24edcfa50_PORT"] = "22";

var tl = require('vsts-task-lib/mock-task');
runner.registerMock('vsts-task-lib/toolrunner', require('vsts-task-lib/mock-toolrunner'));
runner.registerMock('vsts-task-lib/task', "vsts-task-lib/mock-task");

runner.registerMock('./sshutils', {
    _writeLine: function (str){
        console.log(str);
    },
    DummyClient: class {
        constructor() {
            console.log("connection to dummy client established");
        }
        end() {
            console.log("connection to dummy client terminated");
        }
    },
    RemoteCommandOptions: class {
        public failOnStdErr: boolean;
    },
    setupSshClientConnection: function (sshConfig) {
        var defer = Q.defer<any>();
        var client = new this.DummyClient();
        defer.resolve(client);
        return defer.promise;
    },
    runCommandOnRemoteMachine: function(command, sshClient, options) {
         var defer = Q.defer<string>();
         this._writeLine("Dummy Logs");
         defer.resolve("0");
         return defer.promise;
    }
});

runner.run();





