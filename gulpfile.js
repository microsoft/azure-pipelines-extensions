// node built-ins
const path = require('path');
const os = require('os');
const cp = require('child_process');

// build/test script
const admZip = require('adm-zip');
const del = require('del');
const fs = require('fs-extra');
const mocha = require('gulp-mocha');
const minimist = require('minimist');
const semver = require('semver');
const shell = require('shelljs');
// @ts-ignore
const syncRequest = require('sync-request');
const typescript = require('typescript');
const xml2js = require('xml2js');
const args = require('yargs').argv;

// gulp modules
const gts = require('gulp-typescript');
const gulp = require('gulp');
const gutil = require('gulp-util');

const pkgm = require('./package');
const util = require('./package-utils');

// validation
var NPM_MIN_VER = '9.0.0';
var MIN_NODE_VER = '18.0.0';

if (semver.lt(process.versions.node, MIN_NODE_VER)) {
    console.error('requires node >= ' + MIN_NODE_VER + '.  installed: ' + process.versions.node);
    process.exit(1);
}

//
// Options
//
var mopts = {
    string: 'suite',
    boolean: ['perf', 'e2e'],
    default: { suite: '**', perf: false, e2e: false }
};

var options = minimist(process.argv.slice(2), mopts);

//
// Paths
//

var _buildRoot = path.join(__dirname, "_build");
var _packageRoot = "_package";
var _extnBuildRoot = path.join(_buildRoot, "Extensions");
var artifactEnginePath = path.join(_extnBuildRoot, "ArtifactEngine");
var artifactEngineV2Path = path.join(_extnBuildRoot, "ArtifactEngineV2");
var _taskModuleBuildRoot = "_build/TaskModules/";
var sourcePaths = "@(definitions|Extensions)/**/*";
var ExtensionFolder = "Extensions";
var artifactEngineSourcePath = path.join(ExtensionFolder, "ArtifactEngine");
var artifactEngineV2SourcePath = path.join(ExtensionFolder, "ArtifactEngineV2");
var _tempPath = path.join(__dirname, '_temp');
var _testRoot = "_build/";
var _testTemp = "_build/Temp";
var nugetPath = "_nuget";
var cultures = ['en-US', 'de-DE', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'ru-RU', 'zh-CN', 'zh-TW'];

//-----------------------------------------------------------------------------------------------------------------
// Build Tasks
//-----------------------------------------------------------------------------------------------------------------

function errorHandler(error) {
    process.exit(1);
}

var rootTsconfigPath = './base.tsconfig.json';

gulp.task("clean", function() {
    return del([_buildRoot, _packageRoot, nugetPath, _taskModuleBuildRoot]);
});

gulp.task("compilePS", gulp.series("clean", function() {

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
}));

gulp.task("compileNode", gulp.series("compilePS", function(cb){
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

            // external NuGet V2 packages
            if (externals.nugetv2) {
                var nugetPackages = Object.keys(externals.nugetv2);
                nugetPackages.forEach(function (package) {
                    // download and extract the NuGet V2 package
                    var packageVersion = externals.nugetv2[package].version;
                    var packageRepository = externals.nugetv2[package].repository;
                    var copySpecification = externals.nugetv2[package].cp;

                    var packageSource = cacheNuGetV2Package(packageRepository, package, packageVersion);

                    var relativeExternalsPath = path.dirname(externalsJson).replace(new RegExp('/','g'),'\\').replace(path.join(__dirname),'');
                    if(relativeExternalsPath.startsWith('\\')) {
                        relativeExternalsPath = relativeExternalsPath.substring(1);
                    }
                    var destPath = path.join(_buildRoot, relativeExternalsPath);

                    // copy specific files
                    if (!!copySpecification) {
                        copyGroups(copySpecification, packageSource, destPath);
                    }
                });
            }

            // check of task modules
            if(externals.taskModule) {
                var taskModules = Object.keys(externals.taskModule);
                taskModules.forEach(function (moduleIndex) {
                      var module = externals.taskModule[moduleIndex];
                      var srcPath = path.join("TaskModules", module['type'], module['name']);
                      var relativeExternalsPath = path.dirname(externalsJson).replace(new RegExp('/','g'),'\\').replace(path.join(__dirname),'');
                      if(relativeExternalsPath.startsWith('\\')) {
                         relativeExternalsPath = relativeExternalsPath.substring(1);
                      }
                      var destPath = path.join(_buildRoot, relativeExternalsPath, module['dest']);
                      shell.mkdir('-p', destPath);
                      shell.cp('-R', srcPath, destPath);
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
    // Note: when running with --testAreaPath, only a subset of extensions are copied into _build.
    // Guard against missing directories so scoped builds don't fail.
    fs.readdirSync(path.join(__dirname, 'Extensions/')).filter(function (file) {
        var buildExtensionPath = path.join(_extnBuildRoot, file);
        return fs.existsSync(buildExtensionPath) && fs.statSync(buildExtensionPath).isDirectory() && file != "Common";
    }).forEach(compileUIExtensions);

    //Foreach task under extensions copy common modules
    fs.readdirSync(_extnBuildRoot).filter(function (file) {
        return fs.statSync(path.join(_extnBuildRoot, file)).isDirectory() && file != "Common";
    }).forEach(copyCommonModules);

    runNpmInstall(artifactEnginePath, artifactEngineSourcePath);
    runNpmInstall(artifactEngineV2Path, artifactEngineV2SourcePath);

    // Compile tasks
    const tasksProject = gts.createProject(rootTsconfigPath, { typescript: typescript, declaration: true });
    const taskFiles = path.join(_extnBuildRoot, "**", "Tasks", "**", "*.ts");
    const artifactEngineFiles = path.join(_extnBuildRoot, "**", "ArtifactEngine", "**", "*.ts");
    const artifactEngineV2Files = path.join(_extnBuildRoot, "**", "ArtifactEngineV2", "**", "*.ts");

    const testFiles = path.join(_extnBuildRoot, "**/Tests/**/*.ts");

    gulp.src([taskFiles, `!${testFiles}`, artifactEngineFiles, artifactEngineV2Files, '!**/node_modules/**'])
        .pipe(tasksProject())
        .pipe(gulp.dest(path.join(_buildRoot, "Extensions")))
        .on("error", errorHandler);

    const testProject = gts.createProject(rootTsconfigPath, { typescript: typescript, declaration: true });
    const sanitizerTestFiles = path.join(_extnBuildRoot, "**/ps_modules/Sanitizer/Tests/*.ts");

    gulp.src([testFiles, `!${sanitizerTestFiles}`])
        .pipe(testProject())
        .pipe(gulp.dest(path.join(_buildRoot, "Extensions")))
        .on("error", errorHandler);

    validateArtifactEngineTranspileErrors();
    validateArtifactEngineV2TranspileErrors();

    // Generate loc files
    createResjson(cb);
    cb();
}));

var validateArtifactEngineTranspileErrors = () => {
    const tsProject = gts.createProject(path.join(artifactEnginePath, "tsconfig.json"), {
        typescript: require(path.join(artifactEnginePath, "node_modules", "typescript")),
        types: ["mocha", "node"],
        noEmit: true
    });

    gulp.src([
        path.join(artifactEnginePath, "**", "*.ts"),
        `!${path.join(artifactEnginePath, "node_modules", "**")}`
    ])
        .pipe(tsProject())
        .on("error", (error) => {
            console.error(`Error "${error.message}" occurs in a file ${error.fullFilename}`);
            errorHandler();
        });
}

var validateArtifactEngineV2TranspileErrors = () => {
    const tsProject = gts.createProject(path.join(artifactEngineV2Path, "tsconfig.json"), {
        typescript: require(path.join(artifactEngineV2Path, "node_modules", "typescript")),
        types: ["mocha", "node"],
        noEmit: true
    });

    gulp.src([
        path.join(artifactEngineV2Path, "**", "*.ts"),
        `!${path.join(artifactEngineV2Path, "node_modules", "**")}`
    ])
        .pipe(tsProject())
        .on("error", (error) => {
            console.error(`Error "${error.message}" occurs in a file ${error.fullFilename}`);
            errorHandler();
        });
}

var copyGroup = function (group, sourceRoot, destRoot) {
    // example structure to copy a single file:
    // {
    //   "source": "foo.dll"
    // }
    //
    // example structure to copy an array of files/folders to a relative directory:
    // {
    //   "source": [
    //     "foo.dll",
    //     "bar",
    //   ],
    //   "dest": "baz/",
    //   "options": "-R"
    // }
    //
    // example to multiply the copy by .NET culture names supported by TFS:
    // {
    //   "source": "<CULTURE_NAME>/foo.dll",
    //   "dest": "<CULTURE_NAME>/"
    // }
    //

    // multiply by culture name (recursive call to self)
    if (group.dest && group.dest.indexOf('<CULTURE_NAME>') >= 0) {
        cultures.forEach(function (cultureName) {
            // culture names do not contain any JSON-special characters, so this is OK (albeit a hack)
            var localizedGroupJson = JSON.stringify(group).replace(/<CULTURE_NAME>/g, cultureName);
            copyGroup(JSON.parse(localizedGroupJson), sourceRoot, destRoot);
        });

        return;
    }

    // build the source array
    var source = typeof group.source == 'string' ? [group.source] : group.source;
    source = source.map(function (val) { // root the paths
        return path.join(sourceRoot, val);
    });

    // create the destination directory
    var dest = group.dest ? path.join(destRoot, group.dest) : destRoot + '/';
    dest = path.normalize(dest);
    shell.mkdir('-p', dest);

    // copy the files
    if (group.hasOwnProperty('options') && group.options) {
        shell.cp(group.options, source, dest);
    }
    else {
        shell.cp(source, dest);
    }
}

var copyGroups = function (groups, sourceRoot, destRoot) {
    groups.forEach(function (group) {
        copyGroup(group, sourceRoot, destRoot);
    })
}

function createResjson(callback) {
    try {
        var allLibJson = shell.find(path.join(__dirname, 'Extensions'))
            .filter(function (file) {
                return file.match(/(\/|\\)lib\.json$/);
            });

        allLibJson.forEach(function (libJson) {
            console.log('Generating resJson for ' + libJson);

            // create a key->value map of the default strings
            var defaultStrings = {};
            var lib = JSON.parse(fs.readFileSync(libJson));
            if (lib.messages) {
                for (var key of Object.keys(lib.messages)) {
                    // skip resjson-style comments for localizers
                    if (!key || key.match(/^_.+\.comment$/)) {
                        continue;
                    }

                    defaultStrings[`loc.messages.${key}`] = lib.messages[key];
                }
            }

            // create the culture-specific resjson files
            for (var culture of cultures) {
                // initialize the culture-specific strings from the default strings
                var cultureStrings = {};
                for (var key of Object.keys(defaultStrings)) {
                    cultureStrings[key] = defaultStrings[key];
                }

                // load the culture-specific xliff file
                var xliffPath = path.join(path.dirname(libJson), 'xliff', `${culture}.xlf`);
                var stats;
                try {
                    stats = fs.statSync(xliffPath);
                }
                catch (err) {
                    if (err.code != 'ENOENT') {
                        throw err;
                    }
                }

                if (stats) {
                    // parse the culture-specific xliff contents
                    var parser = new xml2js.Parser();
                    var xliff;
                    parser.parseString(
                        fs.readFileSync(xliffPath),
                        function (err, result) {
                            if (err) {
                                throw err;
                            }

                            xliff = result;
                        });

                    // overlay the translated strings
                    for (var unit of xliff.xliff.file[0].body[0]['trans-unit']) {
                        if (unit.target[0].$.state == 'translated' &&
                            defaultStrings.hasOwnProperty(unit.$.id) &&
                            defaultStrings[unit.$.id] == unit.source[0]) {

                            cultureStrings[unit.$.id] = unit.target[0]._;
                        }
                    }
                }

                // write the culture-specific resjson file
                var resjsonPath = path.join(path.dirname(libJson), 'Strings', 'resources.resjson', culture, 'resources.resjson');
                var resjsonContents = JSON.stringify(cultureStrings, null, 2);
                shell.mkdir('-p', path.dirname(resjsonPath));
                fs.writeFileSync(resjsonPath, resjsonContents.replace(/\n/g, os.EOL));
            }
        });
    }
    catch (err) {
        console.log('error:' + err.message);
        callback(new gutil.PluginError('compileTasks', err.message));
        throw err;
    }
}

function runNpmInstall(packagePath, sourcePath) {
    var originalDir = shell.pwd();
    util.cd(packagePath);
    var packageJsonPath = util.rp('package.json');
    if (util.test('-f', packageJsonPath)) {
        util.run(`npm ci --userconfig ${path.join(__dirname, sourcePath, ".npmrc")}`);
    }
    util.cd(originalDir);
}

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

gulp.task("updateTestIds", function(cb) {
    if (args.test) {
        var buildExtensionsRoot = path.join(_buildRoot, 'Extensions');
        if (fs.existsSync(buildExtensionsRoot)) {
            var extensionDirs = fs.readdirSync(buildExtensionsRoot).filter(function (file) {
                return fs.statSync(path.join(buildExtensionsRoot, file)).isDirectory();
            });
            extensionDirs.forEach(function (extName) {
                // Check multiple possible locations for vss-extension.json
                var possiblePaths = [
                    path.join(buildExtensionsRoot, extName, 'Src', 'vss-extension.json'),
                    path.join(buildExtensionsRoot, extName, 'src', 'vss-extension.json'),
                    path.join(buildExtensionsRoot, extName, 'vss-extension.json')
                ];

                var manifestPath = null;
                for (var i = 0; i < possiblePaths.length; i++) {
                    if (fs.existsSync(possiblePaths[i])) {
                        manifestPath = possiblePaths[i];
                        break;
                    }
                }

                if (manifestPath) {
                    try {
                        // Read file and handle potential BOM
                        var fileContent = fs.readFileSync(manifestPath, 'utf8');
                        // Remove BOM if present
                        if (fileContent.charCodeAt(0) === 0xFEFF) {
                            fileContent = fileContent.slice(1);
                        }

                        var manifest = JSON.parse(fileContent);
                        var updated = false;

                        // Check for both 'id' and 'extensionId' properties
                        var idProperty = manifest.id ? 'id' : (manifest.extensionId ? 'extensionId' : null);

                        if (idProperty && manifest[idProperty] && !manifest[idProperty].endsWith('-test')) {
                            manifest[idProperty] = manifest[idProperty] + '-test';
                            updated = true;
                        }

                        // Update name property
                        if (manifest.hasOwnProperty('name')) {
                            manifest.name = `${manifest.name} (Test)`;
                        }

                        // Always set public to false if it exists
                        if (manifest.hasOwnProperty('public') && manifest.public !== false) {
                            manifest.public = false;
                            updated = true;
                        } else if (!manifest.hasOwnProperty('public')) {
                            // Add public: false if it doesn't exist
                            manifest.public = false;
                            updated = true;
                        }

                        if (updated) {
                            // Write back without BOM
                            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
                            console.log('Updated manifest for test build: ' + manifestPath);
                            console.log('  - ' + idProperty + ': ' + manifest[idProperty]);
                            console.log('  - Public: ' + manifest.public);
                        } else if (idProperty && manifest[idProperty].endsWith('-test')) {
                            console.log('Extension already has -test suffix: ' + manifestPath);
                        }
                    } catch (e) {
                        console.error('Failed to update manifest: ' + manifestPath + ' - ' + e.message);
                    }
                } else {
                    console.log('No vss-extension.json found for extension: ' + extName);
                }
            });
        }
    }
    cb();
});

gulp.task("build", gulp.series("compileNode", "updateTestIds"));

gulp.task("default", gulp.series("build"));

//-----------------------------------------------------------------------------------------------------------------
// Test Tasks
//-----------------------------------------------------------------------------------------------------------------

gulp.task('compileTests', function () {
    var proj = gts.createProject(rootTsconfigPath, { typescript: typescript, declaration: true });
    var testsPath = path.join(__dirname, 'Extensions/**/Tests', '**/*.ts');
    var commonFiles = path.join(__dirname, 'Extensions/**/Common', '**/*.ts')

    return gulp.src([testsPath, commonFiles, 'definitions/*.d.ts'])
        .pipe(proj())
        .pipe(gulp.dest(_testRoot+"\\Extensions"))
        .on('error', errorHandler);
});

gulp.task('testLib', gulp.series('compileTests', function () {
    return gulp.src(['Extensions/Common/lib/**/*'])
        .pipe(gulp.dest(path.join(_testRoot,'Extensions/Common/lib/')));
}));

gulp.task('copyTestData', gulp.series('compileTests', function () {
    return gulp.src(['Extensions/**/Tests/**/data/**'], { dot: true })
        .pipe(gulp.dest(_testRoot+"\\Extensions"));
}));

gulp.task('tstests', gulp.series('compileTests', function () {
    return gulp.src(['Extensions/**/Tests/**/*.ts', 'Extensions/**/Tests/**/*.json', 'Extensions/**/Tests/**/*.js'])
        .pipe(gulp.dest(_testRoot+"\\Extensions"));
}));

gulp.task('ps1tests', gulp.series('compileTests', function () {
    return gulp.src(['Extensions/**/Tests/**/*.ps1', 'Extensions/**/Tests/**/*.json'])
        .pipe(gulp.dest(_testRoot+"\\Extensions"));
}));

gulp.task('testLib_NodeModules', gulp.series('testLib', function () {
    return gulp.src(path.join(__dirname, 'node_modules/azure-pipelines-task-lib/**/*'))
        .pipe(gulp.dest(path.join(_testRoot, 'Extensions/Common/lib/node_modules/azure-pipelines-task-lib')));
}));

gulp.task('testResources', gulp.parallel('testLib_NodeModules', 'ps1tests', 'tstests', 'copyTestData'));

gulp.task("test", gulp.series("testResources", function(){
    process.env['TASK_TEST_TEMP'] =path.join(__dirname, _testTemp);
    shell.rm('-rf', _testTemp);
    shell.mkdir('-p', _testTemp);

    if (options.suite.indexOf("ArtifactEngine") >= 0  && options.e2e) {
        var suitePath = path.join(_testRoot, "Extensions/" + options.suite + "/**/*e2e.js");
        console.log(suitePath);
        var tfBuild = ('' + process.env['TF_BUILD']).toLowerCase() == 'true'
        return gulp.src([suitePath])
            .pipe(mocha({ reporter: 'spec', ui: 'bdd', useColors: !tfBuild }));
    }

    if (options.suite.indexOf("ArtifactEngine") >= 0  && options.perf) {
        var suitePath = path.join(_testRoot, "Extensions/" + options.suite + "/**/*perf.js");
        console.log(suitePath);
        var tfBuild = ('' + process.env['TF_BUILD']).toLowerCase() == 'true'
        return gulp.src([suitePath])
            .pipe(mocha({ reporter: 'spec', ui: 'bdd', useColors: !tfBuild }));
    }

    var suitePath = path.join(_testRoot,"Extensions/" + options.suite + "/Tests/Tasks", options.suite + '/_suite.js');
    console.log(suitePath);
    var suitePath2 = path.join(_testRoot, "Extensions/" + options.suite + "/**/*Tests.js");
    console.log(suitePath2);
    var tfBuild = ('' + process.env['TF_BUILD']).toLowerCase() == 'true'
    var ignorePath = "!" + path.join(_testRoot, "Extensions",  "/**/UIContribution{,/**}");
    return gulp.src([ suitePath, suitePath2, ignorePath ], { allowEmpty: true })
        .pipe(mocha({ reporter: 'spec', ui: 'bdd', useColors: !tfBuild }));
}));

//-----------------------------------------------------------------------------------------------------------------
// Package
//-----------------------------------------------------------------------------------------------------------------

var publisherName = null;
gulp.task("package", function(cb) {
    if (args.publisher) {
        publisherName = args.publisher;
    }

    // use gulp package --extension=<Extension_Name> to package an individual package
    if (args.extension) {
        createVsixPackage(args.extension);        return;
    }

    fs.readdirSync(_extnBuildRoot).filter(function (file) {
        return fs.statSync(path.join(_extnBuildRoot, file)).isDirectory() && file != "Common";
    }).forEach(createVsixPackage);
    cb();
});


var copyCommonModules = function(extensionName) {
    var commonDeps = require('./common.json');
    var commonSrc = path.join(__dirname, 'Extensions/Common');
    var currentExtnRoot = path.join(__dirname, "_build/Extensions" ,extensionName);
    const extensionSourcePath = path.join(__dirname, "Extensions", extensionName);
    return gulp.src(path.join(currentExtnRoot, '**/task.json'))
        .pipe(pkgm.copyCommonModules(currentExtnRoot, commonDeps, commonSrc, extensionSourcePath));
}

var createVsixPackage = function(extensionName) {
    var extnOutputPath = path.join(_packageRoot, extensionName);
    var extnManifestPath = path.join(_extnBuildRoot, extensionName, "Src");

    if(fs.existsSync(extnManifestPath)) {
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
}

var executeCommand = function(cmd, callback) {
    shell.exec(cmd, {silent: true}, function(code, output) {
        if (code != 0) {
            console.error("command failed: " + cmd + "\nManually execute to debug");
        } else {
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
        return targetPath;
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

    return targetPath;
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
    return cacheArchiveFile(repository.replace(/\/$/, '') + '?id=' + name + '&version=' + version);
}
