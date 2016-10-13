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
var _testRoot = "_build/";
var _testTemp = "_build/Temp";

//-----------------------------------------------------------------------------------------------------------------
// Build Tasks
//-----------------------------------------------------------------------------------------------------------------

function errorHandler(err) {
    process.exit(1);
}

var proj = gts.createProject('./tsconfig.json', { typescript: typescript });
var ts = gts(proj);

gulp.task("clean", function() {
    return del([_buildRoot, _packageRoot]);
});

gulp.task("compilePS", ["clean"], function() {
    
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

gulp.task("compileNode", ["compilePS"],function(){
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

    // Compile UIExtensions
    fs.readdirSync( path.join(__dirname, 'Extensions/')).filter(function (file) {
        return fs.statSync(path.join(_extnBuildRoot, file)).isDirectory() && file != "Common";
    }).forEach(compileUIExtensions);

    // Compile tasks
    var tasksPath = path.join(__dirname, 'Extensions/**/Tasks', '**/*.ts');
    return gulp.src([tasksPath, 'definitions/*.d.ts'])
        .pipe(ts)
        .on('error', errorHandler)
        .pipe(gulp.dest(path.join(_buildRoot, 'Extensions')));
})

function compileUIExtensions(extensionRoot) {
    var uiExtensionsPath = path.join(_buildRoot,"Extensions", extensionRoot, 'Src', 'UIExtensions');
    var tsconfigPath = path.join(uiExtensionsPath,"tsconfig.json");
    if (fs.existsSync(tsconfigPath)) {
        var projLocal = gts.createProject(tsconfigPath, { typescript: typescript });
        var tsLocal = gts(projLocal);
        var uiFilePath = path.join(uiExtensionsPath, '**/**/*.ts');
        return gulp.src([uiFilePath])
        .pipe(tsLocal)
        .on('error', errorHandler)
        .pipe(gulp.dest(uiExtensionsPath));
    };
}

gulp.task("build", ["compileNode"], function() {
    //Foreach task under extensions copy common modules
    fs.readdirSync(_extnBuildRoot).filter(function (file) {
        return fs.statSync(path.join(_extnBuildRoot, file)).isDirectory() && file != "Common";
    }).forEach(copyCommonModules);
});

gulp.task("default", ["build"]);

//-----------------------------------------------------------------------------------------------------------------
// Test Tasks
//-----------------------------------------------------------------------------------------------------------------

gulp.task('compileTests', function () {
    var testsPath = path.join(__dirname, 'Extensions/**/Tests', '**/*.ts');

    return gulp.src([testsPath, 'definitions/*.d.ts'])
        .pipe(ts)
        .on('error', errorHandler)
        .pipe(gulp.dest(_testRoot+"\\Extensions"));
});

gulp.task('testLib', ['compileTests'], function () {
    return gulp.src(['Extensions/Common/lib/**/*'])
        .pipe(gulp.dest(path.join(_testRoot,'Extensions/Common/lib/')));
});

gulp.task('copyTestData', ['compileTests'], function () {
    return gulp.src(['Extensions/**/Tests/**/data/**'], { dot: true })
        .pipe(gulp.dest(_testRoot+"\\Extensions"));
});

gulp.task('ps1tests', ['compileTests'], function () {
    return gulp.src(['Extensions/**/Tests/**/*.ps1', 'Extensions/**/Tests/**/*.json'])
        .pipe(gulp.dest(_testRoot+"\\Extensions"));
});

gulp.task('testLib_NodeModules', ['testLib'], function () {
    return gulp.src(path.join(__dirname, 'Extensions/Common/lib/vsts-task-lib/**/*'))
        .pipe(gulp.dest(path.join(_testRoot, 'Extensions/Common/lib/node_modules/vsts-task-lib')));
});

gulp.task('testResources', ['testLib_NodeModules', 'ps1tests', 'copyTestData']);

gulp.task("_mochaTests", ["testResources"], function(){
    process.env['TASK_TEST_TEMP'] =path.join(__dirname, _testTemp);
    shell.rm('-rf', _testTemp);
    shell.mkdir('-p', _testTemp);
    var suitePath = path.join(_testRoot,"Extensions/**/Tests/", options.suite + '/_suite.js');
    var tfBuild = ('' + process.env['TF_BUILD']).toLowerCase() == 'true'
    return gulp.src([suitePath])
        .pipe(mocha({ reporter: 'spec', ui: 'bdd', useColors: !tfBuild }));
});

gulp.task("test", ["_mochaTests"],function(done){
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

//-----------------------------------------------------------------------------------------------------------------
// Package
//-----------------------------------------------------------------------------------------------------------------

var publisherName = null;
gulp.task("package",  function() {
    if(args.publisher){
        publisherName = args.publisher;
    }

    // use gulp package --extension=<Extension_Name> to package an individual package		
    if(args.extension){		
        createVsixPackage(args.extension);		
        return;		
    }
    fs.readdirSync(_extnBuildRoot).filter(function (file) {
        return fs.statSync(path.join(_extnBuildRoot, file)).isDirectory() && file != "Common";
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
    var extnManifestPath = path.join(_extnBuildRoot, extensionName, "Src");
    del(extnOutputPath);
    if (publisherName){
        var manifest = JSON.parse(fs.readFileSync(path.join(extnManifestPath,"vss-extension.json")));
        manifest.publisher = publisherName;
        fs.writeFileSync(path.join(extnManifestPath,"vss-extension.json"), JSON.stringify(manifest));
    }
    shell.mkdir("-p", extnOutputPath);
    var packagingCmd = "tfx extension create --manifest-globs vss-extension.json --root " + extnManifestPath + " --output-path " + extnOutputPath;
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
