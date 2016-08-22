"use strict";

var tl = require('vsts-task-lib');
var events = require('events');
var Q = require('q');
var shell = require('shelljs');
var path = require('path');

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

var SourceControlWrapper = (function (_super) {
    __extends(SourceControlWrapper, _super);
    function SourceControlWrapper(toolType) {
        _super.call(this);
        this.toolType = toolType;
    }

    SourceControlWrapper.prototype.clone = function (repository, progress, folder, options) {
        options = options || {};
        options.creds = true;
        var args = ['clone', repository];
        if (progress) {
            args.push('--progress');
        }
        if (folder) {
            args.push(folder);
        }
        return this.exec(args, options);
    };

    SourceControlWrapper.prototype.fetch = function (args, options) {
        options = options || {};
        options.creds = true;
        return this.exec(['fetch'].concat(args), options);
    };
    
    SourceControlWrapper.prototype.checkout = function (ref, options) {
        options = options || {};
        options.creds = true;
        return this.exec(['checkout', ref], options);
    };

    SourceControlWrapper.prototype.reset = function (args, options) {
        options = options || {};
        return this.exec(['reset'].concat(args), options);
    };

    SourceControlWrapper.prototype.exec = function (args, options) {
        var _this = this;
        options = options || {};
        var defer = Q.defer();
        
        var toolPath = shell.which(this.toolType, false);
        if (!toolPath) {
            throw (new Error(this.toolType + ' not found.  ensure installed and in the path'));
        }
        var tool = new tl.ToolRunner(toolPath);
        tool.silent = true;
        var creds = this.username + ':' + this.password;
        var escapedCreds = encodeURIComponent(this.username) + ':' + encodeURIComponent(this.password);
        tool.on('debug', function (message) {
            if (options.debugOutput) {
                var repl = message.replace(creds, '...');
                repl = message.replace(escapedCreds, '...');
                _this.emit('stdout', '[debug]' + repl);
            }
        });
        tool.on('stdout', function (data) {
            _this.emit('stdout', data);
        });
        tool.on('stderr', function (data) {
            _this.emit('stderr', data);
        });
        
        args.map(function (arg) {
            tool.arg(arg, true); // raw arg
        });

        options = options || {};
        var ops = {
            cwd: options.cwd || process.cwd(),
            env: options.env || process.env,
            silent: true,
            outStream: options.outStream || process.stdout,
            errStream: options.errStream || process.stderr,
            failOnStdErr: false,
            ignoreReturnCode: false
        };

        return tool.exec(ops);
    };
    return SourceControlWrapper;
}(events.EventEmitter));
exports.SourceControlWrapper = SourceControlWrapper;
