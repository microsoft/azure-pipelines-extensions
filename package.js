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

function copyCommonModules(currentExtnRoot, commonDeps, commonSrc) {
    return through.obj(
        function(taskJson, encoding, done) {
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
                shell.mkdir('-p', targetPath);
                shell.rm(path.join(targetPath, '*.csproj'));
                shell.rm(path.join(targetPath, '*.md'));
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
                        })
                    })
                }

                const externals = require('./externals.json');

                if (Object.keys(task.execution).some(x => x.includes('Node'))) {
                    if (externals['no-cache'].includes(task.name)) {
                        console.log(`⚒️  Building Node task: ${task.name}`);

                        try {
                            cp.execSync(`npm install --prefix ${taskDirPath}`, { stdio: 'ignore' });
                            console.log(`\x1b[A\x1b[K✅ npm install at ${taskDirPath} completed successfully.`);
                        } catch (err) {
                            console.log(`\x1b[A\x1b[K❌ npm install at ${taskDirPath} failed. Error: ${err.message}`);
                            process.exit(1);
                        }

                        // For building UI contribution using webpack
                        if (fs.existsSync(uiPath) && fs.statSync(uiPath).isDirectory()) {
                            util.buildUIContribution(uiPath, uiPath);
                        }
                    } else {

                        // Determine the vsts-task-lib version.
                        var libVer = externals.npm['vsts-task-lib'];
                        if (!libVer) {
                            throw new Error('External vsts-task-lib not defined in externals.json.');
                        }

                        // Copy the lib from the cache.
                        gutil.log('Linking vsts-task-lib ' + libVer);
                        var copySource = path.join(_tempPath, 'npm', 'vsts-task-lib', libVer, 'node_modules', '**');
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


var _strRelPath = path.join('Strings', 'resources.resjson', 'en-US');



var _cultureNames = [
	'cs',
	'de',
	'es',
	'fr',
	'it',
	'ja',
	'ko',
	'pl',
	'pt-BR',
	'ru',
	'tr',
	'zh-Hans',
	'zh-Hant'
];

var createError = function (msg) {
	return new gutil.PluginError('PackageTask', msg);
}

var validateModule = function (folderName, module) {
    var defer = Q.defer();
    defer.resolve();
    return defer.promise;
}


var LOC_FRIENDLYNAME = 'loc.friendlyName';
var LOC_HELPMARKDOWN = 'loc.helpMarkDown';
var LOC_DESCRIPTION = 'loc.description';
var LOC_INSTFORMAT = 'loc.instanceNameFormat';
var LOC_GROUPDISPLAYNAME = 'loc.group.displayName.';
var LOC_INPUTLABEL = 'loc.input.label.';
var LOC_INPUTHELP = 'loc.input.help.';
var LOC_MESSAGES = 'loc.messages.';

var createStrings = function (task, pkgPath, srcPath) {
	var defer = Q.defer();

	var strPath = path.join(pkgPath, _strRelPath);
	shell.mkdir('-p', strPath);
	var srcStrPath = path.join(srcPath, _strRelPath);
	shell.mkdir('-p', srcStrPath);

	//
	// Loc tasks.json and product strings content
	//
	var strings = {};
	strings[LOC_FRIENDLYNAME] = task.friendlyName;
	task['friendlyName'] = 'ms-resource:' + LOC_FRIENDLYNAME;

	strings[LOC_HELPMARKDOWN] = task.helpMarkDown;
	task['helpMarkDown'] = 'ms-resource:' + LOC_HELPMARKDOWN;

	strings[LOC_DESCRIPTION] = task.description;
	task['description'] = 'ms-resource:' + LOC_DESCRIPTION;

	strings[LOC_INSTFORMAT] = task.instanceNameFormat;
	task['instanceNameFormat'] = 'ms-resource:' + LOC_INSTFORMAT;

	if (task.groups) {
		task.groups.forEach(function (group) {
			if (group.name) {
				var key = LOC_GROUPDISPLAYNAME + group.name;
				strings[key] = group.displayName;
				group.displayName = 'ms-resource:' + key;
			}
		});
	}

	if (task.inputs) {
		task.inputs.forEach(function (input) {
			if (input.name) {
				var labelKey = LOC_INPUTLABEL + input.name;
				strings[labelKey] = input.label;
				input.label = 'ms-resource:' + labelKey;

				if (input.helpMarkDown) {
					var helpKey = LOC_INPUTHELP + input.name;
					strings[helpKey] = input.helpMarkDown;
					input.helpMarkDown = 'ms-resource:' + helpKey;
				}
			}
		});
	}

	if (task.messages) {
		for (var key in task.messages) {
			var messageKey = LOC_MESSAGES + key;
			strings[messageKey] = task.messages[key];
			task.messages[key] = 'ms-resource:' + messageKey;
		}
	}

	//
	// Write the tasks.json and strings file in package and back to source
	//
	var enPath = path.join(strPath, 'resources.resjson');
	var enSrcPath = path.join(srcStrPath, 'resources.resjson');

	var enContents = JSON.stringify(strings, null, 2);
	fs.writeFile(enPath, enContents, function (err) {
		if (err) {
			defer.reject(createError('could not create: ' + enPath + ' - ' + err.message));
			return;
		}

		var taskPath = path.join(pkgPath, 'task.loc.json');

		var contents = JSON.stringify(task, null, 2);

		fs.writeFile(taskPath, contents, function (err) {
			if (err) {
				defer.reject(createError('could not create: ' + taskPath + ' - ' + err.message));
				return;
			}

			// copy the loc assets back to the src so they can be checked in
			shell.cp('-f', enPath, enSrcPath);
			shell.cp('-f', taskPath, path.join(srcPath, 'task.loc.json'));

			defer.resolve();
		});

	})

	return defer.promise;
};

function locCommon() {
    return through.obj(
        function (moduleJson, encoding, done) {
            // Validate the module.json file exists.
            if (!fs.existsSync(moduleJson)) {
                new gutil.PluginError('PackageModule', 'Module json cannot be found: ' + moduleJson.path);
            }

            if (moduleJson.isNull() || moduleJson.isDirectory()) {
                this.push(moduleJson);
                return done();
            }

            // Deserialize the module.json.
            var jsonContents = moduleJson.contents.toString();
            var module = {};
            try {
                module = JSON.parse(jsonContents);
            }
            catch (err) {
                done(createError('Common module ' + moduleJson.path + ' parse error: ' + err.message));
                return;
            }

            // Build the content for the en-US resjson file.
            var strPath = path.join(path.dirname(moduleJson.path), _strRelPath);
            shell.mkdir('-p', strPath);
            var strings = {};
            if (module.messages) {
                for (var key in module.messages) {
                    var messageKey = LOC_MESSAGES + key;
                    strings[messageKey] = module.messages[key];
                }
            }

            // Create the en-US resjson file.
            var enPath = path.join(strPath, 'resources.resjson');
            var enContents = JSON.stringify(strings, null, 2);
            fs.writeFile(enPath, enContents, function (err) {
                if (err) {
                    done(createError('Could not create: ' + enPath + ' - ' + err.message));
                    return;
                }
            })

            done();
        });
}

exports.copyCommonModules = copyCommonModules;
exports.LocCommon = locCommon;
