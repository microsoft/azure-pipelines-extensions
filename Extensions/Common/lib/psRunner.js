/// <reference path="../../../definitions/node.d.ts"/>
/// <reference path="../../../definitions/Q.d.ts"/>
"use strict";
const Q = require('q');
const events = require('events');
const child = require('child_process');
var shell = require('shelljs');
function debug(message) {
    if (process.env['TASK_TEST_TRACE']) {
        console.log(message);
    }
}
class PSRunner extends events.EventEmitter {
    constructor() {
        super();
    }
    start() {
        this.emit('starting');
        var defer = Q.defer();
        var powershell = shell.which('powershell.exe');
        this._childProcess = child.spawn(powershell, // command
        [
            '-NoLogo',
            '-Sta',
            '-NoProfile',
            '-NonInteractive',
            '-ExecutionPolicy',
            'Bypass',
            '-Command',
            '. ([System.IO.Path]::Combine(\'' + __dirname + '\', \'Start-TestRunner.ps1\'))'
        ], {
            cwd: __dirname,
            env: process.env
        });
        this._childProcess.stdout.on('data', (data) => {
            // Check for special ouput indicating end of test.
            if (('' + data).indexOf('_END_OF_TEST_ce10a77a_') >= 0) {
                if (this._errors.length > 0) {
                    this._runDeferred.reject(this._errors.join('\n'));
                }
                else {
                    this._runDeferred.resolve(null);
                }
            }
            else if (data != '\n') {
                // Otherwise, normal stdout.
                debug('stdout: ' + data);
            }
        });
        this._childProcess.stderr.on('data', (data) => {
            // Stderr indicates an error record was written to PowerShell's error pipeline.
            debug('stderr: ' + data);
            this._errors.push(data);
        });
    }
    run(psPath, done) {
        this.runPromise(psPath)
            .then(() => {
            done();
        })
            .fail((err) => {
            done(err);
        });
    }
    runPromise(psPath) {
        this.emit('running test');
        this._errors = [];
        this._runDeferred = Q.defer();
        this._childProcess.stdin.write(psPath + '\n');
        return this._runDeferred.promise;
    }
    kill() {
        this._childProcess.kill();
    }
}
exports.PSRunner = PSRunner;
