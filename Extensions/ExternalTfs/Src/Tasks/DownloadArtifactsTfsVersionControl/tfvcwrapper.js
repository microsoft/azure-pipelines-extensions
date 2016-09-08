"use strict";

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

var tl = require('vsts-task-lib');
var shell = require('shelljs');
var path = require('path');
var fs = require('fs');
var events = require('events');
var Q = require('q');
exports.MASK_REPLACEMENT = "********";

var rootDirectory = path.dirname(path.dirname(path.dirname(path.dirname(path.dirname(require.main.filename)))));
var TfvcWrapper = (function (_super) {
    __extends(TfvcWrapper, _super);
    var tfPath;
    var connOptions;
    var isTEE = false;

    function TfvcWrapper() {
        _super.call(this);
        var tfp = shell.which('tf', false);
        var rootDirectory = path.dirname(path.dirname(path.dirname(path.dirname(path.dirname(require.main.filename)))));
        var nonWindows = ['darwin', 'linux'];
        if (nonWindows.indexOf(process.platform) == -1) {
            var agentTf = path.join(rootDirectory, "externals", "vstsom" , "tf.exe");
            if (fs.existsSync(agentTf)) {
                tfp = agentTf;
            }
        }
        else {
            var agentTee = path.join(rootDirectory, "externals", "tee" , "tf");
            if (fs.existsSync(agentTee)) {
                tfp = agentTee;
                isTEE = true;
            }
        }

        tfPath = tfp;
        console.log("Tf Path:" + tfPath);
        connOptions = {};
    }

    TfvcWrapper.prototype.setTfvcConnOptions = function (options) {
        if (options) {
            connOptions = options;
        }
    };

    TfvcWrapper.prototype.deleteWorkspace = function (workspace) {
        return this._exec('workspace', ['-delete', workspace.name], true);
    };

    TfvcWrapper.prototype.newWorkspace = function (workspace) {
        return this._exec("workspace", ['-new', '-permission:Private', '-location:local', workspace.name], true);
    };

    TfvcWrapper.prototype.mapFolder = function (serverPath, localPath, workspace) {
        return this._exec('workfold', ['-map', serverPath, localPath, '-workspace:' + workspace.name], true);
    };

    TfvcWrapper.prototype.unmapFolder = function (serverPath, workspace) {
        return this._exec('workfold', ['-unmap', serverPath, '-workspace:' + workspace.name], true);
    };

    TfvcWrapper.prototype.get = function (version) {
        if (isTEE === true) {
            return this._exec('get', ['.', '-recursive', '-version:' + version, '-noprompt'], true);
        } else {
            return this._exec('get', ['.', '-recursive', '-version:' + version, '-noprompt'], false);
        }
    };

    TfvcWrapper.prototype.listWorkspaces = function () {
            return this._execSync("workspaces", [], true);
    };

    TfvcWrapper.prototype._execSync = function (cmd, args, addDefaultArgs, options) {
        if (tfPath === null) {
            return this._getTfNotInstalled();
        }
        var tf = this._getToolRunner(cmd, args, addDefaultArgs);
        var ops = this._getOpts(options);
        return tf.execSync(ops);
    };

    TfvcWrapper.prototype._exec = function (cmd, args, addDefaultArgs, options) {
        var _this = this;
        if (tfPath === null) {
            return this._getTfNotInstalled();
        }

        console.log("cmd:" + cmd);
        var tf = this._getToolRunner(cmd, args, addDefaultArgs);
        var ops = this._getOpts(options);

        tf.on('debug', function (message) {
            _this.emit('stdout', '[debug]' + _this._scrubCredential(message));
        });
        tf.on('stdout', function (data) {
            _this.emit('stdout', _this._scrubCredential(data));
        });
        tf.on('stderr', function (data) {
            _this.emit('stderr', _this._scrubCredential(data));
        });

        return tf.exec(ops);
    };

    TfvcWrapper.prototype._getToolRunner = function (cmd, args, addDefaultArgs) {
        var tf = new tl.ToolRunner(tfPath);
        tf.silent = true;
        // cmd
        tf.arg(cmd, true);
		
		if (addDefaultArgs === true) {
            // default connection related args
            var collectionArg = '-collection:' + connOptions.collection;
            var loginArg = '-login:' + connOptions.username + ',' + connOptions.password;

            args = args.concat([collectionArg, loginArg]);
        } 
		        
        // args
        args.map(function (arg) {
            tf.arg(arg, true); // raw arg
        });
		
        return tf;
    };

    TfvcWrapper.prototype._getOpts = function (options) {
        var options = options || {};
        var ops = {
            cwd: options.cwd || process.cwd(),
            env: options.env || process.env,
            silent: true,
            outStream: options.outStream || process.stdout,
            errStream: options.errStream || process.stderr,
            failOnStdErr: options.failOnStdErr || false,
            ignoreReturnCode: options.ignoreReturnCode || false
        };
        return ops;
    };

    TfvcWrapper.prototype._scrubCredential = function (msg) {
        if (msg && typeof msg.replace === 'function'
            && connOptions.password) {
            return msg.replace(connOptions.password, exports.MASK_REPLACEMENT);
        }
        return msg;
    };

    TfvcWrapper.prototype._getTfNotInstalled = function () {
        var defer = Q.defer();
        defer.reject(new Error("Ensure team foundation is installed for Windows and add tf.exe in the environment path." +
            "For non-Windows, please install the Microsoft Team Explorer Everywhere cross-platorm, command-line client and add 'tf' to the path.\n"
            + "See https://www.visualstudio.com/products/team-explorer-everywhere-vs.aspx \n"));
        return defer.promise;
    };

    return TfvcWrapper;
}(events.EventEmitter));

exports.TfvcWrapper = TfvcWrapper;
