var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs-extra');
var check = require('validator');
var shell = require('shelljs');
var Q = require('q');
var os = require('os');
var cp = require('child_process');
var gulp = require('gulp');
var request = require('request');
var unzip = require('gulp-unzip');
var stream = require('stream');
var util = require('./package-utils');
var shell = require('shelljs');

var createError = function(msg) {
    return new gutil.PluginError('PackageTask', msg);
}

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

function copyCommonModules(currentExtnRoot, commonDeps, commonSrc){
    return through.obj(

        function(taskJson, encoding, done) {
            if (!fs.existsSync(taskJson)) {
                new gutil.PluginError('PackageTask', 'Task json cannot be found: ' + taskJson.path);
            }

            if (taskJson.isNull() || taskJson.isDirectory()) {
                this.push(taskJson);
                return callback();
            }

            var taskDirPath = path.dirname(taskJson.path);
            var folderName = path.basename(taskDirPath);
            var jsonContents = taskJson.contents.toString();
            var task = {};
            try {
                task = JSON.parse(jsonContents);
            }
            catch (err) {
                done(createError(folderName + ' parse error: ' + err.message));
                return;
            }

            var targetPath;

            validateTask(folderName, task)
            .then(function() {
                // Copy the task to the layout folder.
                targetPath = path.join(currentExtnRoot, "Src", "Tasks", task.name);
                shell.mkdir('-p', targetPath);
                shell.rm(path.join(targetPath, '*.csproj'));
                shell.rm(path.join(targetPath, '*.md'));
                // Statically link the required internal common modules.
                var taskDeps;
                if ((taskDeps = commonDeps[task.name])) {
                    taskDeps.forEach(function (dep) {
                        gutil.log('Linking ' + dep.module + ' into ' + task.name);
                        var src = path.join(commonSrc, dep.module, "Src/");
                        var dest = path.join(targetPath, dep.dest);
                        shell.mkdir('-p', dest);
                        fs.copy(src, dest, "*", function (err) {
                            if (err) return console.error(err) 
                        })
                    })
                }
                var externals = require('./externals.json');
                if (task.execution['Node']) {
                     var doNotCache = false;
                     externals['no-cache'].forEach(function(ext){
                         if(ext == task.name) {
                             doNotCache = true;
                         }
                     });
                     
                     if(doNotCache) {
                        util.buildNodeTask(taskDirPath, targetPath);  
                     } else {

                        // Determine the vsts-task-lib version.
                        var libVer = externals.npm['vsts-task-lib'];
                        if (!libVer) {
                            throw new Error('External vsts-task-lib not defined in externals.json.');
                        }

                        var packageJson = path.join(targetPath, 'package.json');
                        fs.exists(packageJson, (exists) => {
                            if(exists){
                                // Run npm install.
                                gutil.log("Doing npm install in " + targetPath);
                                shell.pushd(targetPath);
                                try {
                                    var cmdline = 'npm install';
                                    var result = cp.execSync(cmdline);
                                    gutil.log(result.toString());
                                    if (result.status > 0) {
                                        throw new Error('npm failed with exit code ' + result.status);
                                    }
                                }
                                finally {
                                    shell.popd();
                                }
                            }
                            else {
                                gutil.log(packageJson + ' doesnot exist.');
                                // Copy the lib from the cache.
                                gutil.log('Linking vsts-task-lib ' + libVer);
                                var copySource = path.join(_tempPath, 'npm', 'vsts-task-lib', libVer, 'node_modules', '**');
                                var copyTarget = path.join(targetPath, 'node_modules');
                                shell.mkdir('-p', copyTarget);
                                gulp.src([copySource]).pipe(gulp.dest(copyTarget));
                            }
                        });
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
                return callback();
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

function assertParameter(value, name) {
	if (!value) {
		throw new Error('"' + name + '" cannot be null or empty.');
	}
}


exports.copyCommonModules = copyCommonModules;
exports.LocCommon = locCommon;
