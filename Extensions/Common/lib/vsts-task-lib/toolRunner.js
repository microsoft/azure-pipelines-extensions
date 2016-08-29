/// <reference path="../../../../definitions/node.d.ts" />
/// <reference path="../../../../definitions/Q.d.ts" />
"use strict";
const Q = require('q');
const os = require('os');
const events = require('events');
const mock = require('./mock');
var run = function (cmd, callback) {
    console.log('running: ' + cmd);
    var output = '';
    try {
    }
    catch (err) {
        console.log(err.message);
    }
};
;
function debug(message) {
    // do nothing, overridden
}
exports.debug = debug;
;
class ToolRunner extends events.EventEmitter {
    constructor(toolPath) {
        debug('toolRunner toolPath: ' + toolPath);
        super();
        this.toolPath = toolPath;
        this.args = [];
        this.silent = false;
    }
    _debug(message) {
        if (!this.silent) {
            debug(message);
        }
        this.emit('debug', message);
    }
    _argStringToArray(argString) {
        var args = [];
        var inQuotes = false;
        var escaped = false;
        var arg = '';
        var append = function (c) {
            // we only escape double quotes.
            if (escaped && c !== '"') {
                arg += '\\';
            }
            arg += c;
            escaped = false;
        };
        for (var i = 0; i < argString.length; i++) {
            var c = argString.charAt(i);
            if (c === '"') {
                if (!escaped) {
                    inQuotes = !inQuotes;
                }
                else {
                    append(c);
                }
                continue;
            }
            if (c === "\\" && inQuotes) {
                escaped = true;
                continue;
            }
            if (c === ' ' && !inQuotes) {
                if (arg.length > 0) {
                    args.push(arg);
                    arg = '';
                }
                continue;
            }
            append(c);
        }
        if (arg.length > 0) {
            args.push(arg.trim());
        }
        return args;
    }
    arg(val) {
        if (!val) {
            return;
        }
        if (val instanceof Array) {
            this._debug(this.toolPath + ' arg: ' + JSON.stringify(val));
            this.args = this.args.concat(val);
        }
        else if (typeof (val) === 'string') {
            this._debug(this.toolPath + ' arg: ' + val);
            this.args = this.args.concat(this._argStringToArray(val));
        }
    }
    argString(val) {
        if (!val) {
            return;
        }
        this._debug(this.toolPath + ' arg: ' + val);
        this.args = this.args.concat(this._argStringToArray(val));
    }
    pathArg(val) {
        this._debug(this.toolPath + ' pathArg: ' + val);
        this.arg(val);
    }
    argIf(condition, val) {
        if (condition) {
            this.arg(val);
        }
    }
    //
    // Exec - use for long running tools where you need to stream live output as it runs
    //        returns a promise with return code.
    //
    exec(options) {
        var defer = Q.defer();
        this._debug('exec tool: ' + this.toolPath);
        this._debug('Arguments:');
        this.args.forEach((arg) => {
            this._debug('   ' + arg);
        });
        var success = true;
        options = options || {};
        var ops = {
            cwd: options.cwd || process.cwd(),
            env: options.env || process.env,
            silent: options.silent || false,
            outStream: options.outStream || process.stdout,
            errStream: options.errStream || process.stderr,
            failOnStdErr: options.failOnStdErr || false,
            ignoreReturnCode: options.ignoreReturnCode || false
        };
        var argString = this.args.join(' ') || '';
        var cmdString = this.toolPath;
        if (argString) {
            cmdString += (' ' + argString);
        }
        this._debug('ignoreTempPath=' + process.env['MOCK_IGNORE_TEMP_PATH']);
        this._debug('tempPath=' + process.env['MOCK_TEMP_PATH']);
        if (process.env['MOCK_IGNORE_TEMP_PATH'] === 'true') {
            // Using split/join to replace the temp path
            cmdString = cmdString.split(process.env['MOCK_TEMP_PATH']).join('');
        }
        if (!ops.silent) {
            ops.outStream.write('[command]' + cmdString + os.EOL);
        }
        // TODO: filter process.env
        var res = mock.getResponse('exec', cmdString);
        //console.log(JSON.stringify(res, null, 2));
        if (res.stdout) {
            this.emit('stdout', res.stdout);
            if (!ops.silent) {
                ops.outStream.write(res.stdout + os.EOL);
            }
        }
        if (res.stderr) {
            this.emit('stderr', res.stderr);
            success = !ops.failOnStdErr;
            if (!ops.silent) {
                var s = ops.failOnStdErr ? ops.errStream : ops.outStream;
                s.write(res.stderr + os.EOL);
            }
        }
        var code = res.code;
        ops.outStream.write('rc:' + res.code + os.EOL);
        if (code != 0 && !ops.ignoreReturnCode) {
            success = false;
        }
        ops.outStream.write('success:' + success + os.EOL);
        if (success) {
            defer.resolve(code);
        }
        else {
            defer.reject(new Error(this.toolPath + ' failed with return code: ' + code));
        }
        return defer.promise;
    }
    //
    // ExecSync - use for short running simple commands.  Simple and convenient (synchronous)
    //            but also has limits.  For example, no live output and limited to max buffer
    //
    execSync(options) {
        var defer = Q.defer();
        this._debug('exec tool: ' + this.toolPath);
        this._debug('Arguments:');
        this.args.forEach((arg) => {
            this._debug('   ' + arg);
        });
        var success = true;
        options = options || {};
        var ops = {
            cwd: options.cwd || process.cwd(),
            env: options.env || process.env,
            silent: options.silent || false,
            outStream: options.outStream || process.stdout,
            errStream: options.errStream || process.stderr,
            failOnStdErr: options.failOnStdErr || false,
            ignoreReturnCode: options.ignoreReturnCode || false
        };
        var argString = this.args.join(' ') || '';
        var cmdString = this.toolPath;
        if (argString) {
            cmdString += (' ' + argString);
        }
        if (!ops.silent) {
            ops.outStream.write('[command]' + cmdString + os.EOL);
        }
        var r = mock.getResponse('exec', cmdString);
        if (r.stdout && r.stdout.length > 0) {
            ops.outStream.write(r.stdout);
        }
        if (r.stderr && r.stderr.length > 0) {
            ops.errStream.write(r.stderr);
        }
        return { code: r.code, stdout: (r.stdout) ? r.stdout.toString() : null, stderr: (r.stderr) ? r.stderr.toString() : null };
    }
}
exports.ToolRunner = ToolRunner;
