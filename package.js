const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const shell = require('shelljs');
const through = require('through2');
const check = require('validator');

const util = require('./package-utils');
const externals = require('./externals.json');

/**
 * @typedef {Object} TaskExecutor
 * @property {string} Node - Indicates that the task is executed using Node.js.
 * @property {string} Node10 - Indicates that the task is executed using Node.js version 10.
 * @property {string} Node20 - Indicates that the task is executed using Node.js version 20.
 */

/**
 * @typedef {Object} Task
 * @property {string} id - The unique identifier for the task.
 * @property {string} name - The name of the task, used as a folder name.
 * @property {string} friendlyName - A user-friendly name for the task.
 * @property {string} instanceNameFormat - A format string for the instance name.
 * @property {TaskExecutor} execution - The execution type of the task, e.g., 'Node'.
 */

/**
 * Validates the structure of a task.json file.
 * @param {string} folderName - The name of the folder containing the task, used for error messages if the task name is missing or invalid.
 * @param {Task} task - The task object parsed from task.json.
 * @returns {Promise<void>}
 */
function validateTask(folderName, task) {
    return new Promise((resolve, reject) => {
        const vn = (task.name || folderName);

        if (!task.id || !check.isUUID(task.id)) {
            return reject(new Error(`${vn}: id is a required guid`));
        } else if (!task.name || !check.isAlphanumeric(task.name)) {
            return reject(new Error(`${vn}: name is a required alphanumeric string`));
        } else if (!task.friendlyName || !check.isLength(task.friendlyName, 1, 40)) {
            return reject(new Error(`${vn}: friendlyName is a required string <= 40 chars`));
        } else if (!task.instanceNameFormat) {
            return reject(new Error(`${vn}: instanceNameFormat is required`));
        }

        return resolve();
    });
};

/**
 * Parses the contents of a task.json file into a Task object.
 * @param {string} jsonContents
 * @returns {Task|null} The parsed Task object if successful, or null if parsing fails.
 */
function parseTaskJson(jsonContents) {
    try {
        return JSON.parse(jsonContents);
    } catch (err) {
        return null;
    }
}

/**
 * Gulp plugin to copy common modules into the extension's task folders and build UI contribution if exists.
 * @param {string} currentExtnRoot - The root directory of the current extension being packaged.
 * @param {Record<string, Array<{module: string, dest: string}>>} commonDeps - An object mapping task folder names to their common module dependencies.
 * @param {string} commonSrc - The source directory for common modules.
 * @param {string} extensionSourcePath - The source path of the extension being packaged.
 * @returns {NodeJS.ReadWriteStream} A through2 stream that processes task.json files, copies common modules, and builds UI contributions.
 */
function copyCommonModules(currentExtnRoot, commonDeps, commonSrc, extensionSourcePath) {
    return through.obj(function(taskJson, _encoding, done) {
        if (!fs.existsSync(taskJson.path)) {
            return done(new Error('Task json cannot be found: ' + taskJson.path));
        }

        if (taskJson.isNull() || taskJson.isDirectory()) {
            this.push(taskJson);
            return done();
        }

        const taskDirPath = path.dirname(taskJson.path);
        const folderName = path.basename(taskDirPath);

        /** @type {Task|null} */
        const task = parseTaskJson(taskJson.contents.toString());

        if (task === null) {
            done(new Error('Parse error in task.json: ' + taskJson.path));
            return;
        }

        validateTask(folderName, task)
        .then(function () {
            // Copy the task to the layout folder.
            const targetPath = path.join(currentExtnRoot, "Src", "Tasks", task.name);
            const taskSourcePath = path.join(extensionSourcePath, "Src", "Tasks", task.name);
            shell.mkdir('-p', targetPath);
            shell.rm('-f', path.join(targetPath, '*.csproj'));
            shell.rm('-f', path.join(targetPath, '*.md'));
            // Path to UI contribution files
            const uiPath = path.join(currentExtnRoot, "Src", "UIContribution");
            // Statically link the required internal common modules.
            let taskDeps;

            if ((taskDeps = commonDeps[folderName])) {
                taskDeps.forEach(function (dep) {
                    console.log('Linking ' + dep.module + ' into ' + folderName);
                    const src = path.join(commonSrc, dep.module, "Src/");
                    const dest = path.join(targetPath, dep.dest);
                    shell.mkdir('-p', dest);
                    fs.cp(src, dest, { recursive: true }, function (err) {
                        if (err) return console.error(err)
                    });
                })
            }

            // For building UI contribution using webpack
            if (fs.existsSync(uiPath) && fs.statSync(uiPath).isDirectory()) {
                console.log(`⚒️  Building UI contribution for task: ${task.name}`);
                const originalDir = shell.pwd();
                util.cd(uiPath);
                util.run('npm ci --userconfig ' + path.join(__dirname, ".npmrc"));
                util.cd(originalDir);
            }

            if (Object.keys(task.execution).some(x => x.includes('Node'))) {
                console.log(`⚒️  Building Node task: ${task.name}`);

                try {
                    const npmrcPath = path.join(taskSourcePath, ".npmrc");
                    installDependencies(taskDirPath, task.name, npmrcPath);
                    console.log(`\x1b[A\x1b[K✅ npm ci at ${taskDirPath} completed successfully.`);
                } catch (err) {
                    console.log(`\x1b[A\x1b[K❌ npm ci at ${taskDirPath} failed. Error: ${err.message}`);
                    process.exit(1);
                }
            }
        })
        .then(function () {
            done();
        })
        .catch(function (err) {
            done(err);
        });
    });
}

/**
 * Installs the dependencies for a given task using npm ci, with options to handle engine-strict mode and verbose logging.
 * @param {string} taskPath - The file system path to the task for which dependencies should be installed.
 * @param {string} taskName - The name of the task, used for determining if engine-strict mode should be disabled based on externals configuration.
 * @param {string} npmrcPath - The path to the .npmrc file for the task.
 */
function installDependencies(taskPath, taskName, npmrcPath) {
    console.log(`Installing dependencies for task: ${taskName} at path: ${taskPath}`);
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const npmArgs = ['ci', '--prefix', taskPath, '--userconfig', `"${npmrcPath}"`, '--verbose'];

    // Opt specific tasks out of engine-strict. The outer `npx gulp build` loads
    // the root .npmrc and exports its settings as npm_config_* env vars, which
    // take precedence over any nested .npmrc. A CLI flag is the only thing that
    // overrides those inherited env vars without disabling engine-strict globally.
    if ((externals['no-engine-strict'] || []).includes(taskName)) {
        npmArgs.splice(1, 0, '--no-engine-strict');
    }

    cp.execFileSync(npmCmd, npmArgs, { stdio: util.isDebug() ? 'inherit' : 'ignore', shell: true });
}

module.exports = {
    copyCommonModules,
    installDependencies
}
