var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs-extra');
var check = require('validator');
var shell = require('shelljs');
var Q = require('q');
var os = require('os');
var cp = require('child_process');

var createError = function(msg) {
    return new gutil.PluginError('PackageTask', msg);
}

var validateTask = function(folderName, task) {
    var defer = Q.defer();

    var vn = (task.name  || folderName);

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
