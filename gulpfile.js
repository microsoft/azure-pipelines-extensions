// node built-ins
var cp = require('child_process');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fs = require('fs-extra');
var path = require('path');
var os = require('os');

// build/test script
var admZip = require('adm-zip');
var minimist = require('minimist');
var mocha = require('gulp-mocha');
var Q = require('q');
var semver = require('semver');
var shell = require('shelljs');
var syncRequest = require('sync-request');

// gulp modules
var del = require('del');
var gts = require('gulp-typescript');
var gulp = require('gulp');
var gutil = require('gulp-util');
var pkgm = require('./package');
var typescript = require('typescript');
var zip = require('gulp-zip');
var args   = require('yargs').argv;

// validation
var NPM_MIN_VER = '3.0.0';
var MIN_NODE_VER = '4.0.0';

if (semver.lt(process.versions.node, MIN_NODE_VER)) {
    console.error('requires node >= ' + MIN_NODE_VER + '.  installed: ' + process.versions.node);
    process.exit(1);
}

//
// Options
//
var mopts = {
    string: 'suite',
    default: { suite: '**' }
};

var options = minimist(process.argv.slice(2), mopts);

//
// Paths
//

var _buildRoot = "_build";
var _packageRoot = "_package";
var _extnBuildRoot = "_build/Extensions/";
var sourcePaths = "Extensions/**/*";
var ExtensionFolder = "Extensions";
var _tempPath = path.join(__dirname, '_temp');

//-----------------------------------------------------------------------------------------------------------------
// Build Tasks
//-----------------------------------------------------------------------------------------------------------------

function errorHandler(err) {
    process.exit(1);
}

var proj = gts.createProject('./tsconfig.json', { typescript: typescript });
var ts = gts(proj);

gulp.task("clean", function(cb) {
    return del([_buildRoot, _packageRoot], cb);
});

gulp.task("compilePS", ["clean"], function(done) {
    
    if(args.testAreaPath === undefined )
    {
        return gulp.src(sourcePaths, { base: "." }).pipe(gulp.dest(_buildRoot)); 
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
                    
            return gulp.src(filter, { base: "." }).pipe(gulp.dest(_buildRoot)); 
        }
        else
        {
            console.log('No module is updated with given change-set');
            // Create a _build/Extensions folder which will be empty
            return gulp.src(ExtensionFolder, { base: "." }).pipe(gulp.dest(_buildRoot)); 
        }
    }
});

gulp.task("compileNode", ["compilePS"],function(cb){
     try {
        // Cache all externals in the download directory.
        var allExternalsJson = shell.find(path.join(__dirname, 'Extensions'))
            .filter(function (file) {
                return file.match(/(\/|\\)externals\.json$/);
            })
            .concat(path.join(__dirname, 'externals.json'));
        allExternalsJson.forEach(function (externalsJson) {
            // Load the externals.json file.
            console.log('Loading ' + externalsJson);
            var externals = require(externalsJson);

            // Check for NPM externals.
            if (externals.npm) {
                // Walk the dictionary.
                var packageNames = Object.keys(externals.npm);
                packageNames.forEach(function (packageName) {
                    // Cache the NPM package.
                    var packageVersion = externals.npm[packageName];
                    cacheNpmPackage(packageName, packageVersion);
                });
            }
            // Check for NuGetV2 externals.
            if (externals.nugetv2) {
                // Walk the dictionary.
                var packageNames = Object.keys(externals.nugetv2);
                packageNames.forEach(function (packageName) {
                    // Cache the NuGet V2 package.
                    var packageVersion = externals.nugetv2[packageName].version;
                    var packageRepository = externals.nugetv2[packageName].repository;
                    cacheNuGetV2Package(packageRepository, packageName, packageVersion);
                })
            }
            // Check for archive files.
            if (externals.archivePackages) {
                // Walk the array.
                externals.archivePackages.forEach(function (archive) {
                    // Cache the archive file.
                    cacheArchiveFile(archive.url);
                });
            }
        });
    }
    catch (err) {
        console.log('error:' + err.message);
        cb(new gutil.PluginError('compileTasks', err.message));
        return;
    }

    var tasksPath = path.join(__dirname, 'Extensions', '**/*.ts');
    return gulp.src([tasksPath, 'definitions/*.d.ts'])
        .pipe(ts)
        .on('error', errorHandler)
        .pipe(gulp.dest(path.join(__dirname, 'Extensions')));
})

gulp.task("build", ["compileNode"], function() {
    //Foreach task under extensions copy common modules
    fs.readdirSync(_extnBuildRoot).filter(function (file) {
        return fs.statSync(path.join(_extnBuildRoot, file)).isDirectory() && file != "Common";
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

gulp.task("locCommon",function(){
    return gulp.src(path.join(__dirname, 'Extensions/Common/**/module.json')) 
             .pipe(pkgm.LocCommon()); 
});


var copyCommonModules = function(extensionName) {

    var commonDeps = require('./common.json');
    var commonSrc = path.join(__dirname, 'Extensions/Common');
    var currentExtnRoot = path.join(__dirname, "_build/Extensions" ,extensionName);
    return gulp.src(path.join(currentExtnRoot, '**/task.json'))
        .pipe(pkgm.copyCommonModules(currentExtnRoot, commonDeps, commonSrc));
}

var createVsixPackage = function(extensionName) {
    var extnOutputPath = path.join(_packageRoot, extensionName);
    var extnManifestPath = path.join(extn_BuildRoot, extensionName, "Src");
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


var cacheArchiveFile = function (url) {
    // Validate the parameters.
    if (!url) {
        throw new Error('Parameter "url" cannot be null or empty.');
    }

    // Short-circuit if already downloaded.
    var scrubbedUrl = url.replace(/[/\:?]/g, '_');
    var targetPath = path.join(_tempPath, 'archive', scrubbedUrl);
    if (shell.test('-d', targetPath)) {
        console.log('Archive file already cached: ' + url);
        return;
    }

    console.log('Downloading archive file: ' + url);

    // Delete any previous partial attempt.
    var partialPath = path.join(_tempPath, 'partial', 'archive', scrubbedUrl);
    if (shell.test('-d', partialPath)) {
        shell.rm('-rf', partialPath);
    }

    // Download the archive file.
    shell.mkdir('-p', partialPath);
    var file = path.join(partialPath, 'file.zip');
    var result = syncRequest('GET', url);
    fs.writeFileSync(file, result.getBody());

    // Extract the archive file.
    console.log("Extracting archive.");
    var directory = path.join(partialPath, "dir");
    var zip = new admZip(file);
    zip.extractAllTo(directory);

    // Move the extracted directory.
    shell.mkdir('-p', path.dirname(targetPath));
    shell.mv(directory, targetPath);

    // Remove the remaining partial directory.
    shell.rm('-rf', partialPath);
}

var cacheNpmPackage = function (name, version) {
    // Validate the parameters.
    if (!name) {
        throw new Error('Parameter "name" cannot be null or empty.');
    }

    if (!version) {
        throw new Error('Parameter "version" cannot be null or empty.');
    }

    // Short-circuit if already downloaded.
    gutil.log('Downloading npm package ' + name + '@' + version);
    var targetPath = path.join(_tempPath, 'npm', name, version);
    if (shell.test('-d', targetPath)) {
        console.log('Package already cached. Skipping.');
        return;
    }

    // Delete any previous partial attempt.
    var partialPath = path.join(_tempPath, 'partial', 'npm', name, version);
    if (shell.test('-d', partialPath)) {
        shell.rm('-rf', partialPath);
    }

    // Write a temporary package.json file to npm install warnings.
    //
    // Note, write the file higher up in the directory hierarchy so it is not included
    // when the partial directory is moved into the target location
    shell.mkdir('-p', partialPath);
    var pkg = {
        "name": "temp",
        "version": "1.0.0",
        "description": "temp to avoid warnings",
        "main": "index.js",
        "dependencies": {},
        "devDependencies": {},
        "repository": "http://norepo/but/nowarning",
        "scripts": {
            "test": "echo \"Error: no test specified\" && exit 1"
        },
        "author": "",
        "license": "MIT"
    };
    fs.writeFileSync(
        path.join(_tempPath, 'partial', 'npm', 'package.json'),
        JSON.stringify(pkg, null, 2));

    // Validate npm is in the PATH.
    var npmPath = shell.which('npm');
    if (!npmPath) {
        throw new Error('npm not found.  ensure npm 3 or greater is installed');
    }

    // Validate the version of npm.
    var versionOutput = cp.execSync('"' + npmPath + '" --version');
    var npmVersion = versionOutput.toString().replace(/[\n\r]+/g, '')
    console.log('npm version: "' + npmVersion + '"');
    if (semver.lt(npmVersion, NPM_MIN_VER)) {
        throw new Error('npm version must be at least ' + NPM_MIN_VER + '. Found ' + npmVersion);
    }

    // Make a node_modules directory. Otherwise the modules will be installed in a node_modules
    // directory further up the directory hierarchy.
    shell.mkdir('-p', path.join(partialPath, 'node_modules'));

    // Run npm install.
    shell.pushd(partialPath);
    try {
        var cmdline = '"' + npmPath + '" install ' + name + '@' + version;
        var result = cp.execSync(cmdline);
        gutil.log(result.toString());
        if (result.status > 0) {
            throw new Error('npm failed with exit code ' + result.status);
        }
    }
    finally {
        shell.popd();
    }

    // Move the intermediate directory to the target location.
    shell.mkdir('-p', path.dirname(targetPath));
    shell.mv(partialPath, targetPath);
}

var cacheNuGetV2Package = function (repository, name, version) {
    // Validate the parameters.
    if (!repository) {
        throw new Error('Parameter "repository" cannot be null or empty.');
    }

    if (!name) {
        throw new Error('Parameter "name" cannot be null or empty.');
    }

    if (!version) {
        throw new Error('Parameter "version" cannot be null or empty.');
    }

    // Cache the archive file.
    cacheArchiveFile(repository.replace(/\/$/, '') + '/package/' + name + '/' + version);
}

var QExec = function (commandLine) {
    var defer = Q.defer();

    gutil.log('running: ' + commandLine)
    var child = exec(commandLine, function (err, stdout, stderr) {
        if (err) {
            defer.reject(err);
            return;
        }

        if (stdout) {
            gutil.log(stdout);
        }

        if (stderr) {
            gutil.log(stderr);
        }

        defer.resolve();
    });

    return defer.promise;
}

gulp.task('zip', ['build'], function (done) {
    shell.mkdir('-p', _wkRoot);
    var zipPath = path.join(_wkRoot, 'contents');

    return gulp.src(path.join(_buildRoot, '**', '*'))
        .pipe(zip('Microsoft.TeamFoundation.Build.Tasks.zip'))
        .pipe(gulp.dest(zipPath));
});

