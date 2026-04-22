const cp = require('child_process');
const path = require('path');

const fs = require('fs-extra');
const gulp = require('gulp');
const gutil = require('gulp-util');
const Q = require('q');
const shell = require('shelljs');
const through = require('through2');
const check = require('validator');

const util = require('./package-utils');

var createError = function(msg) {
    return new gutil.PluginError('PackageTask', msg);
}

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

// Validates the structure of a task.json file.
var validateTask = function(folderName, task) {
    var defer = Q.defer();

    var vn = (task.name || folderName);

    if (!task.id || !check.isUUID(task.id)) {
        defer.reject(createError(vn + ': id is a required guid'));
    };

    if (!task.name || !check.isAlphanumeric(task.name)) {
        defer.reject(createError(vn + ': name is a required alphanumeric string'));
    }

    if (!task.friendlyName || !check.isLength(task.friendlyName, 1, 40)) {
        defer.reject(createError(vn + ': friendlyName is a required string <= 40 chars'));
    }

    if (!task.instanceNameFormat) {
        defer.reject(createError(vn + ': instanceNameFormat is required'));
    }

    // resolve if not already rejected
    defer.resolve();
    return defer.promise;
};
var _tempPath = path.join(__dirname, '_temp');

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
    return through.obj(
        function(taskJson, _encoding, done) {
            if (!fs.existsSync(taskJson)) {
                new gutil.PluginError('PackageTask', 'Task json cannot be found: ' + taskJson.path);
            }

            if (taskJson.isNull() || taskJson.isDirectory()) {
                this.push(taskJson);
                return done();
            }

            var taskDirPath = path.dirname(taskJson.path);
            var folderName = path.basename(taskDirPath);

            /** @type {Task} */
            var task = parseTaskJson(taskJson.contents.toString());

            if (task === null) {
                done(createError('Parse error in task.json: ' + taskJson.path));
                return;
            }


            validateTask(folderName, task)
            .then(function() {
                // Copy the task to the layout folder.
                const targetPath = path.join(currentExtnRoot, "Src", "Tasks", task.name);
                const taskSourcePath = path.join(extensionSourcePath, "Src", "Tasks", task.name);
                shell.mkdir('-p', targetPath);
                shell.rm('-f', path.join(targetPath, '*.csproj'));
                shell.rm('-f', path.join(targetPath, '*.md'));
                // Path to UI contribution files
                const uiPath = path.join(currentExtnRoot, "Src", "UIContribution");
                // Statically link the required internal common modules.
                var taskDeps;

                if ((taskDeps = commonDeps[folderName])) {
                    taskDeps.forEach(function (dep) {
                        gutil.log('Linking ' + dep.module + ' into ' + folderName);
                        var src = path.join(commonSrc, dep.module, "Src/");
                        var dest = path.join(targetPath, dep.dest);
                        shell.mkdir('-p', dest);
                        fs.copy(src, dest, "*", function (err) {
                            if (err) return console.error(err)
                        });
                    })
                }

                const externals = require('./externals.json');

                // For building UI contribution using webpack
                if (fs.existsSync(uiPath) && fs.statSync(uiPath).isDirectory()) {
                    console.log(`⚒️  Building UI contribution for task: ${task.name}`);
                    var originalDir = shell.pwd();
                    util.cd(uiPath);
                    util.run('npm ci');
                    util.cd(originalDir);
                }

                if (Object.keys(task.execution).some(x => x.includes('Node'))) {
                    if (externals['no-cache'].includes(task.name)) {
                        console.log(`⚒️  Building Node task: ${task.name}`);

                        const originalDir = shell.pwd();

                        try {
                            util.cd(taskDirPath);
                            const npmrcPath = path.join(taskSourcePath, ".npmrc");
                            const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
                            const npmArgs = ['ci', '--userconfig', `"${npmrcPath}"`];
                            if (util.isDebug()) {
                                npmArgs.splice(1, 0, '--verbose');
                                cp.execFileSync(npmCmd, npmArgs, { stdio: 'inherit', shell: true });
                            } else {
                                cp.execFileSync(npmCmd, npmArgs, { stdio: 'ignore', shell: true });
                            }
                            console.log(`\x1b[A\x1b[K✅ npm ci at ${taskDirPath} completed successfully.`);
                        } catch (err) {
                            console.log(`\x1b[A\x1b[K❌ npm ci at ${taskDirPath} failed. Error: ${err.message}`);
                            process.exit(1);
                        } finally {
                            util.cd(originalDir);
                        }
                    } else {
                        // Determine the azure-pipelines-task-lib version.
                        var libVer = externals.npm['azure-pipelines-task-lib'];

                        if (!libVer) {
                            throw new Error('External azure-pipelines-task-lib not defined in externals.json.');
                        }

                        // Copy the lib from the cache.
                        gutil.log('Linking azure-pipelines-task-lib ' + libVer);
                        var copySource = path.join(_tempPath, 'npm', 'azure-pipelines-task-lib', libVer, 'node_modules', '**');
                        var copyTarget = path.join(targetPath, 'node_modules');
                        shell.mkdir('-p', copyTarget);
                        gulp.src([copySource]).pipe(gulp.dest(copyTarget));
                    }
                }
                return;
            })
            .then(function() {
                done();
            })
            .fail(function(err) {
                done(err);
            })
        });
}


exports.copyCommonModules = copyCommonModules;
