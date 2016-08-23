/// <reference path="../../../definitions/node.d.ts"/>
/// <reference path="../../../definitions/Q.d.ts"/>
/// <reference path="../../../definitions/shelljs.d.ts"/>
/// <reference path="../../../definitions/vsts-task-lib.d.ts"/>
"use strict";
const Q = require('q');
const events = require('events');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const shell = require('shelljs');
const tcm = require('vsts-task-lib/taskcommand');
function debug(message) {
    if (process.env['TASK_TEST_TRACE']) {
        console.log(message);
    }
}
class TaskRunner extends events.EventEmitter {
    constructor(extensionName, name, normalizeSlashes, ignoreTempPathsInResponse) {
        super();
        this._inputs = {};
        this._name = name;
        this._extensionName = extensionName;
        this._taskEnv = {};
        this._taskEnv['MOCK_RESPONSES'] = process.env['MOCK_RESPONSES'];
        this.succeeded = true;
        this.failed = false;
        this.resultWasSet = false;
        this.invokedToolCount = 0;
        this.stdout = '';
        this.stderr = '';
        this._tempPath = process.env['TASK_TEST_TEMP'];
        this._commands = [];
        this._normalizeSlashes = normalizeSlashes;
        this._ignoreTempPathsInResponse = ignoreTempPathsInResponse;
    }
    ran(cmdLine) {
        var executed = false;
        this._commands.forEach((cmd) => {
            if (cmdLine.trim().localeCompare(cmd.trim()) === 0) {
                executed = true;
            }
        });
        return executed;
    }
    setInput(name, val) {
        this._inputs[name] = val;
    }
    //
    // stderr/out
    //
    stdErrContained(text) {
        return this.stderr.indexOf(text) >= 0;
    }
    run() {
        this.emit('starting');
        var defer = Q.defer();
        if (!this._tempPath) {
            throw (new Error('Temp is not defined'));
        }
        this._taskSrcPath = path.join(__dirname, '..', '..', this._extensionName, 'Src\\Tasks', this._name);
        if (!fs.existsSync(this._taskSrcPath)) {
            throw (new Error('Did you build with "gulp"? Task does not exist: ' + this._taskSrcPath));
        }
        // copy mocked vsts-task-lib if it doesn't exist
        var modPath = path.join(this._tempPath, 'node_modules');
        if (!shell.test('-d', modPath)) {
            shell.mkdir('-p', modPath);
            shell.cp('-R', path.join(__dirname, 'node_modules/vsts-task-lib'), path.join(modPath));
        }
        // copy the task over so we can execute from Temp 
        // this forces it to use the mocked vsts-task-lib and provides isolation
        this._taskPath = path.join(this._tempPath, this._name);
        if (!shell.test('-d', this._taskPath)) {
            shell.mkdir('-p', this._taskPath);
            shell.cp('-R', this._taskSrcPath, this._tempPath);
        }
        // delete it's linked copy of vsts-task-lib so it uses the mocked task-lib above
        var taskLibPath = path.join(this._taskPath, 'node_modules', 'vsts-task-lib');
        if (shell.test('-d', taskLibPath)) {
            shell.rm('-rf', taskLibPath);
        }
        var jsonPath = path.join(this._taskPath, 'task.json');
        if (!fs.existsSync(jsonPath)) {
            throw (new Error('Task json does not exist: ' + jsonPath));
        }
        var json = fs.readFileSync(jsonPath).toString();
        this._task = JSON.parse(json);
        this._tryRunNode()
            .then(() => {
            this.emit('completed');
            defer.resolve(null);
        })
            .fail((err) => {
            defer.reject(err);
        })
            .fin(() => {
            // cleanup
        });
        return defer.promise;
    }
    _processOutput(stdout, stderr) {
        this.stdout = stdout || '';
        this.stderr = stderr || '';
        var stdoutLines = [];
        if (stdout) {
            stdoutLines = stdout.split('\n');
        }
        stdoutLines.forEach((line) => {
            if (line.indexOf('[command]') >= 0) {
                ++this.invokedToolCount;
                var command = line.substr(line.indexOf('[command]') + '[command]'.length).trim();
                this._commands.push(command);
            }
            if (line.indexOf('##vso[') >= 0) {
                var cmd = tcm.commandFromString(line);
                //console.log(JSON.stringify(cmd, null, 2));
                if (cmd.command === "task.complete") {
                    if (cmd.properties['result'] === 'Failed') {
                        this.failed = true;
                        this.succeeded = false;
                        this.resultWasSet = true;
                    }
                    else if (cmd.properties['result'] === 'Succeeded') {
                        this.succeeded = true;
                        this.failed = false;
                        this.resultWasSet = true;
                    }
                }
            }
        });
    }
    _tryRunNode() {
        var defer = Q.defer();
        //
        // Match node handler logic in agent.  The vars is the protocol
        //
        var env = process.env;
        for (var key in this._inputs) {
            var envVarName = 'INPUT_' + key.replace(' ', '_').toUpperCase();
            this._taskEnv[envVarName] = this._inputs[key];
        }
        // Add additional environment variables based on test requirements
        // These variables can be used by the mocked task-lib classes
        this._taskEnv['MOCK_TEMP_PATH'] = this._tempPath;
        this._taskEnv['MOCK_IGNORE_TEMP_PATH'] = this._ignoreTempPathsInResponse;
        this._taskEnv['MOCK_NORMALIZE_SLASHES'] = this._normalizeSlashes;
        //
        // Run the task via node
        //
        var nodeExecution = this._task.execution['Node'];
        if (nodeExecution) {
            if (!nodeExecution.target) {
                throw (new Error('Execution target not specified'));
            }
            var scriptPath = path.join(this._taskPath, nodeExecution.target);
            if (!shell.test('-f', scriptPath)) {
                throw (new Error('target does not exist: ' + scriptPath));
            }
            var child = child_process.exec('node ' + scriptPath, {
                cwd: this._taskPath,
                // keep current env clean
                env: this._taskEnv
            }, (err, stdout, stderr) => {
                if (err !== null) {
                    defer.reject(err);
                    return;
                }
                var standardOut = stdout.toString();
                var standardErr = stderr.toString();
                if (this._normalizeSlashes) {
                    standardOut = standardOut.replace(/\\/g, "/");
                    standardErr = standardErr.replace(/\\/g, "/");
                }
                this._processOutput(standardOut, standardErr);
                if (stdout) {
                    debug('stdout:');
                    debug(standardOut);
                }
                if (stderr) {
                    debug('stderr:');
                    debug(standardErr);
                }
                defer.resolve(null);
            });
        }
        else {
            defer.resolve(null);
        }
        return defer.promise;
    }
}
exports.TaskRunner = TaskRunner;
