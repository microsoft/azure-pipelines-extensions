var del = require("del");
var gulp = require("gulp");
var args   = require('yargs').argv;
var gulpUtil = require('gulp-util');
var path = require("path");
var shell = require("shelljs");
var spawn = require('child_process').spawn;
var fs = require('fs-extra');

var pkgm = require('./package');

var buildRoot = "_build";
var packageRoot = "_package";
var extnBuildRoot = "_build/Extensions/";
var sourcePaths = "Extensions/**/*";
var ExtensionFolder = "Extensions";

gulp.task("clean", function() {
    return del([buildRoot, packageRoot]);
});

gulp.task("compile", ["clean"], function(done) {
    
    if(args.testAreaPath === undefined )
    {
        return gulp.src(sourcePaths, { base: "." }).pipe(gulp.dest(buildRoot)); 
    }
    else
    {     
        var areaPathArgument = args.testAreaPath;
        if(areaPathArgument.length > 0 )
        {
            console.log('Compiling updated modules - ' + areaPathArgument);
            var areaPaths = areaPathArgument.trim().split(',');
            var filter = [];
            for (var n = 0; n < areaPaths.length; n++) {
                filter.push(ExtensionFolder + '/' + areaPaths[n] + '/**/*')
                } 
                    
            return gulp.src(filter, { base: "." }).pipe(gulp.dest(buildRoot)); 
        }
        else
        {
            console.log('No module is updated with given change-set');
            // Create a _build/Extensions folder which will be empty
            return gulp.src(ExtensionFolder, { base: "." }).pipe(gulp.dest(buildRoot)); 
        }
    }
});

gulp.task("build", ["compile"], function() {
    //Foreach task under extensions copy common modules
    fs.readdirSync(extnBuildRoot).filter(function (file) {
        return fs.statSync(path.join(extnBuildRoot, file)).isDirectory() && file != "Common";
    }).forEach(copyCommonModules);
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

gulp.task("package", ["test"], function() {
    fs.readdirSync(extnBuildRoot).filter(function (file) {
        return fs.statSync(path.join(extnBuildRoot, file)).isDirectory() && file != "Common";
    }).forEach(createVsixPackage);
});

var copyCommonModules = function(extensionName) {

    var commonDeps = require('./common.json');
    var commonSrc = path.join(__dirname, 'Extensions/Common');
    var currentExtnRoot = path.join(__dirname, extnBuildRoot, extensionName);

    return gulp.src(path.join(currentExtnRoot, '**/task.json'))
        .pipe(pkgm.copyCommonModules(currentExtnRoot, commonDeps, commonSrc));
}

var createVsixPackage = function(extensionName) {
    var extnOutputPath = path.join(packageRoot, extensionName);
    var extnManifestPath = path.join(extnBuildRoot, extensionName, "Src");
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
