var del = require("del");
var gulp = require("gulp");
var gulpUtil = require('gulp-util');
var path = require("path");
var shell = require("shelljs");
var spawn = require('child_process').spawn;
var fs = require('fs');

var buildRoot = "_build";
var packageRoot = "_package";
var extnPaths = "_build/Extensions/";
var sourcePaths = "Extensions/**/*";

gulp.task("build", function() {
    gulp.src(sourcePaths, { base: "." }).pipe(gulp.dest(buildRoot));
});

gulp.task("clean", function() {
    return del([buildRoot, packageRoot]);
});

gulp.task("test", ["build"], function(done) {
    // Runs powershell pester tests ( Unit Test)
    var pester = spawn('powershell.exe', ['.\\InvokePester.ps1'], { stdio: 'inherit' });
    pester.on('exit', function(code, signal) {

        if (code != 0) {
           throw new gulpUtil.PluginError({
              plugin: 'test',
              message: 'Pester Tests Failed!!!'
           });

        }
        else {
            done();
        }
    });

    pester.on('error', function(err) {
        gutil.log('We may be in a non-windows machine or powershell.exe is not in path. Skip pester tests.');
        done();
    });
});


gulp.task("package", function() {
        fs.readdirSync(extnPaths).filter(function (file) {
            return fs.statSync(path.join(extnPaths, file)).isDirectory() && file != "Common";
        }).forEach(createVsixPackage);
});

var createVsixPackage = function(extensionName) {
    var extnOutputPath = path.join(packageRoot, extensionName);
    var extnManifestPath = path.join(extnPaths, extensionName, "Src");
    del(extnOutputPath);
    shell.mkdir("-p", extnOutputPath);
    var packagingCmd = "tfx extension create --manifeset-globs vss-extension.json --root " + extnManifestPath + " --output-path " + extnOutputPath;
    executeCommand(packagingCmd, function() {});
}

var executeCommand = function(cmd, callback) {
    shell.exec(cmd, {silent: true}, function(code, output) {
       if(code != 0) {
           console.error("command failed: " + cmd + "\nManually execute to debug");
       }
       else {
           callback();
       }
    });
}

gulp.task("default", ["build"]);
