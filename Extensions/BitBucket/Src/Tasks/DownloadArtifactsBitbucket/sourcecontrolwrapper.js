const tl = require('azure-pipelines-task-lib/task');
const events = require('events');

/**
 * @typedef {Object} ExecOptions
 * @property {boolean} [creds]
 * @property {boolean} [debugOutput]
 * @property {string} [cwd]
 * @property {NodeJS.ProcessEnv} [env]
 * @property {NodeJS.WritableStream} [outStream]
 * @property {NodeJS.WritableStream} [errStream]
 */

class SourceControlWrapper extends events.EventEmitter {
    /**
     * @param {string} toolType
     */
    constructor(toolType) {
        super();
        this.toolType = toolType;
        /** @type {string | undefined} */
        this.username = undefined;
        /** @type {string | undefined} */
        this.password = undefined;
    }

    /**
     * @param {string} repository
     * @param {boolean} progress
     * @param {string | undefined} folder
     * @param {ExecOptions | undefined} options
     */
    clone(repository, progress, folder, options) {
        options = options || {};
        options.creds = true;
        const args = ['clone', repository];
        if (progress) {
            args.push('--progress');
        }
        if (folder) {
            args.push(folder);
        }
        return this.exec(args, options);
    }

    /**
     * @param {string[]} args
     * @param {ExecOptions | undefined} options
     */
    fetch(args, options) {
        options = options || {};
        options.creds = true;
        return this.exec(['fetch'].concat(args), options);
    }

    /**
     * @param {string} ref
     * @param {ExecOptions} [options]
     */
    checkout(ref, options) {
        options = options || {};
        options.creds = true;
        return this.exec(['checkout', ref], options);
    }

    /**
     * @param {string[]} args
     * @param {ExecOptions | undefined} options
     */
    reset(args, options) {
        options = options || {};
        return this.exec(['reset'].concat(args), options);
    }

    /**
     * @param {string[]} args
     * @param {ExecOptions | undefined} options
     */
    exec(args, options) {
        const self = this;
        const execOptions = options || {};

        /** @type {string} */
        let toolPath;
        try {
            toolPath = tl.which(this.toolType, true);
        } catch (e) {
            throw (new Error(this.toolType + ' not found.  ensure installed and in the path'));
        }
        const tool = tl.tool(toolPath.toString());
        const username = this.username || '';
        const password = this.password || '';
        const creds = username + ':' + password;
        const escapedCreds = encodeURIComponent(username) + ':' + encodeURIComponent(password);
        try {
            tl.setSecret(password);
            tl.setSecret(escapedCreds);
        } catch (e) {
            tl.warning('Failed to mask credentials for log redaction.');
        }
        tool.on('debug', function (/** @type {string} */ message) {
            if (execOptions.debugOutput) {
                let repl = message.replace(creds, '...').replace(escapedCreds, '...');
                self.emit('stdout', '[debug]' + repl);
            }
        });
        tool.on('stdout', function (/** @type {Buffer | string} */ data) {
            self.emit('stdout', data);
        });
        tool.on('stderr', function (/** @type {Buffer | string} */ data) {
            self.emit('stderr', data);
        });

        args.forEach(function (/** @type {string} */ arg) {
            tool.arg(arg);
        });

        const ops = {
            cwd: execOptions.cwd || process.cwd(),
            env: execOptions.env || process.env,
            silent: true,
            outStream: execOptions.outStream || process.stdout,
            errStream: execOptions.errStream || process.stderr,
            failOnStdErr: false,
            ignoreReturnCode: false
        };

        return tool.exec(ops);
    }
}

exports.SourceControlWrapper = SourceControlWrapper;
