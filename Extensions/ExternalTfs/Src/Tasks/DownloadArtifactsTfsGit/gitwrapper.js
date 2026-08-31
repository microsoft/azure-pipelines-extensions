const fs = require('fs');
const EventEmitter = require('events');
const path = require('path');

const { which } = require('azure-pipelines-task-lib/task');
const { ToolRunner } = require('azure-pipelines-task-lib/toolrunner');

const envGitUsername = 'GIT_USERNAME';
const envGitPassword = 'GIT_PASSWORD';

/**
 * @typedef {Object} GitExecOptions
 * @property {boolean} [useGitExe]
 * @property {boolean} [creds]
 * @property {boolean} [debugOutput]
 * @property {string} [cwd]
 * @property {NodeJS.ProcessEnv} [env]
 * @property {NodeJS.WritableStream} [outStream]
 * @property {NodeJS.WritableStream} [errStream]
 */

class GitWrapper extends EventEmitter {
    constructor() {
        super();
        this.gitInstalled = which('git') !== '';
        /** @type {string} */
        this.username = '';
        /** @type {string} */
        this.password = '';
    }

    /**
     * @param {string} repository
     * @param {boolean} [progress]
     * @param {string} [folder]
     * @param {GitExecOptions} [options]
     */
    clone(repository, progress, folder, options) {
        options = options || {};
        options.useGitExe = true;
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
     * @param {GitExecOptions} [options]
     */
    fetch(args, options) {
        options = options || {};
        options.useGitExe = true;
        options.creds = true;
        return this.exec(['fetch'].concat(args), options);
    }

    /**
     * @param {string} ref
     * @param {GitExecOptions} [options]
     */
    checkout(ref, options) {
        options = options || {};
        options.useGitExe = true;
        options.creds = true;
        return this.exec(['checkout', ref], options);
    }

    /**
     * @param {string[]} args
     * @param {GitExecOptions} [options]
     */
    reset(args, options) {
        options = options || {};
        options.useGitExe = true;
        return this.exec(['reset'].concat(args), options);
    }

    /**
     * @param {string[]} args
     * @param {GitExecOptions} [options]
     */
    exec(args, options) {
        const opts = options || {};
        let gitPath = which('git') || undefined;
        // Prefer the agent-provisioned git so tasks work without relying on PATH.
        const mainFilename = require.main ? require.main.filename : __filename;
        const rootDirectory = path.dirname(path.dirname(path.dirname(path.dirname(path.dirname(mainFilename)))));
        const agentGit = path.join(rootDirectory, "externals", "git", "cmd", "git.exe");
        if (fs.existsSync(agentGit)) {
            gitPath = agentGit;
        }
        if (!gitPath) {
            throw new Error('git not found.  ensure installed and in the path');
        }

        const git = new ToolRunner(gitPath);

        const creds = this.username + ':' + this.password;
        const escapedCreds = encodeURIComponent(this.username) + ':' + encodeURIComponent(this.password);

        git.on('debug', (/** @type {string} */ message) => {
            if (opts.debugOutput) {
                let repl = message.replace(creds, '...');
                repl = repl.replace(escapedCreds, '...');
                this.emit('stdout', '[debug]' + repl);
            }
        });
        git.on('stdout', (/** @type {Buffer} */ data) => {
            this.emit('stdout', data);
        });
        git.on('stderr', (/** @type {Buffer} */ data) => {
            this.emit('stderr', data);
        });

        args.map((/** @type {string} */ arg) => {
            git.arg(arg);
        });

        const ops = {
            cwd: opts.cwd || process.cwd(),
            env: opts.env || process.env,
            silent: true,
            outStream: opts.outStream || process.stdout,
            errStream: opts.errStream || process.stderr,
            failOnStdErr: false,
            ignoreReturnCode: false
        };

        return git.exec(ops)
            .fin(() => {
                delete process.env[envGitUsername];
                delete process.env[envGitPassword];
            });
    }
}

exports.envGitUsername = envGitUsername;
exports.envGitPassword = envGitPassword;
exports.GitWrapper = GitWrapper;