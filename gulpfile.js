// node built-ins
const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseArgs } = require('node:util');
// build/test script
const admZip = require('adm-zip');
const shell = require('shelljs');
// @ts-ignore
const syncRequest = require('sync-request');
const typescript = require('typescript');
const xml2js = require('xml2js');

// gulp modules
const gts = require('gulp-typescript');
const gulp = require('gulp');

const pkgm = require('./package');
const util = require('./package-utils');

const { values: options } = parseArgs({
    args: process.argv.slice(2),
    options: {
        gulpfile: { type: 'string' },
        suite: { type: 'string', default: '**' },
        testAreaPath: { type: 'string' },
        publisher: { type: 'string' },
        extension: { type: 'string' },
        syncVersions: { type: 'string' },
        perf: { type: 'boolean', default: false },
        e2e: { type: 'boolean', default: false },
        runAllSuites: { type: 'string' },
        test: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: true,
});

const _buildRoot = path.join(__dirname, "_build");
const _packageRoot = "_package";
const _extnBuildRoot = path.join(_buildRoot, "Extensions");
const artifactEnginePath = path.join(_extnBuildRoot, "ArtifactEngine");
const artifactEngineV2Path = path.join(_extnBuildRoot, "ArtifactEngineV2");
const _taskModuleBuildRoot = "_build/TaskModules/";
const sourcePaths = "@(definitions|Extensions)/**/*";
const ExtensionFolder = "Extensions";
const artifactEngineSourcePath = path.join(ExtensionFolder, "ArtifactEngine");
const artifactEngineV2SourcePath = path.join(ExtensionFolder, "ArtifactEngineV2");
const _tempPath = path.join(__dirname, '_temp');
const _testRoot = "_build/";
const _testTemp = "_build/Temp";
const nugetPath = "_nuget";
const cultures = ['en-US', 'de-DE', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'ru-RU', 'zh-CN', 'zh-TW'];

/**
 * Common error handler for build tasks. Logs the error and exits with code 1 to fail the build.
 * @param {string} [error] - The error message to log before exiting.
 * @returns {void}
 */
function errorHandler(error) {
    console.error(`Build failed ${error ? `with error: ${error}` : 'with an unknown error'}`);
    process.exit(1);
}

const rootTsconfigPath = './base.tsconfig.json';

gulp.task("clean", function (cb) {
    [_buildRoot, _packageRoot, nugetPath, _taskModuleBuildRoot].forEach(function (p) {
        fs.rmSync(p, { recursive: true, force: true });
    });
    cb();
});

gulp.task("compilePS", gulp.series("clean", function () {
    if (options.testAreaPath === undefined) {
        return gulp.src(sourcePaths, { base: ".", encoding: false }).pipe(gulp.dest(_buildRoot));
    } else {
        if (options.testAreaPath.length > 0) {
            console.log('Compiling updated modules - ' + options.testAreaPath);
            const areaPaths = options.testAreaPath.trim().split(',');
            const filter = [];

            for (let n = 0; n < areaPaths.length; n++) {
                filter.push(ExtensionFolder + '/' + areaPaths[n] + '/**/*')
            }

            return gulp.src(filter, { base: ".", encoding: false }).pipe(gulp.dest(_buildRoot));
        } else {
            console.log('No module is updated with given change-set');
            // Create a _build/Extensions folder which will be empty
            return gulp.src(ExtensionFolder, { base: ".", encoding: false }).pipe(gulp.dest(_buildRoot));
        }
    }
}));

gulp.task("compileNode", gulp.series("compilePS", function (cb) {
    try {
        // Cache all externals in the download directory.
        // Cache all externals in the download directory.
        // Note: shelljs 0.10 `shell.find` returns only the root path itself when
        // given a Windows-style absolute path — use the relative "Extensions"
        // directory instead so it walks recursively.
        shell.find('Extensions')
            .filter((file) => file.match(/(\/|\\)externals\.json$/))
            .map((file) => path.resolve(file))
            .concat(path.join(__dirname, 'externals.json'))
            .forEach((externalsJson) => {
                // Load the externals.json file.
                console.log('Loading ' + externalsJson);
                const externals = require(externalsJson);

                // Check for NPM externals.
                if (externals.npm) {
                    // Walk the dictionary.
                    const packageNames = Object.keys(externals.npm);
                    packageNames.forEach(function (packageName) {
                        // Cache the NPM package.
                        const packageVersion = externals.npm[packageName];
                        cacheNpmPackage(packageName, packageVersion);
                    });
                }

                // external NuGet V2 packages
                if (externals.nugetv2) {
                    const nugetPackages = Object.keys(externals.nugetv2);
                    nugetPackages.forEach(function (pkg) {
                        // download and extract the NuGet V2 package
                        const packageVersion = externals.nugetv2[pkg].version;
                        const packageRepository = externals.nugetv2[pkg].repository;
                        const copySpecification = externals.nugetv2[pkg].cp;

                        const packageSource = cacheNuGetV2Package(packageRepository, pkg, packageVersion);

                        let relativeExternalsPath = path.dirname(externalsJson).replace(new RegExp('/', 'g'), '\\').replace(path.join(__dirname), '');

                        if (relativeExternalsPath.startsWith('\\')) {
                            relativeExternalsPath = relativeExternalsPath.substring(1);
                        }

                        const destPath = path.join(_buildRoot, relativeExternalsPath);

                        // copy specific files
                        if (!!copySpecification) {
                            copyGroups(copySpecification, packageSource, destPath);
                        }
                    });
                }

                // check of task modules
                if (externals.taskModule) {
                    const taskModules = Object.keys(externals.taskModule);
                    taskModules.forEach(function (moduleIndex) {
                        const module = externals.taskModule[moduleIndex];
                        const srcPath = path.join("TaskModules", module['type'], module['name']);
                        let relativeExternalsPath = path.dirname(externalsJson).replace(new RegExp('/', 'g'), '\\').replace(path.join(__dirname), '');

                        if (relativeExternalsPath.startsWith('\\')) {
                            relativeExternalsPath = relativeExternalsPath.substring(1);
                        }

                        const destPath = path.join(_buildRoot, relativeExternalsPath, module['dest']);
                        shell.mkdir('-p', destPath);
                        shell.cp('-R', srcPath, destPath);
                    });
                }
            });
    } catch (err) {
        console.log('error:' + err.message);
        cb(new Error('compileTasks: ' + err.message));
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

    gulp.src([taskFiles, `!${testFiles}`, artifactEngineFiles, artifactEngineV2Files, '!**/node_modules/**'], { base: _extnBuildRoot })
        .pipe(tasksProject())
        .pipe(gulp.dest(path.join(_buildRoot, "Extensions")))
        .on("error", errorHandler);

    const testProject = gts.createProject(rootTsconfigPath, { typescript: typescript, declaration: true });
    const sanitizerTestFiles = path.join(_extnBuildRoot, "**/ps_modules/Sanitizer/Tests/*.ts");

    gulp.src([testFiles, `!${sanitizerTestFiles}`], { base: _extnBuildRoot })
        .pipe(testProject())
        .pipe(gulp.dest(path.join(_buildRoot, "Extensions")))
        .on("error", errorHandler);

    validateArtifactEngineTranspileErrors();
    validateArtifactEngineV2TranspileErrors();

    // Generate loc files
    createResjson(cb);
    cb();
}));

function validateArtifactEngineTranspileErrors() {
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

/**
 * Copy a group of files from a source root to a destination root, with support for options and culture-specific expansion.
 * @param {Record<string, any>} group - An object specifying a "source" (string or array of strings), an optional "dest" (string), and optional "options" (string) for the shell.cp command. If the "dest" contains "<CULTURE_NAME>", the copy will be automatically expanded for each culture in the predefined cultures list by replacing "<CULTURE_NAME>" with the culture name in both the source and destination paths.
 * @param {string} sourceRoot - The root directory to prepend to each source path in the group. This allows the group definition to specify paths relative to a common root.
 * @param {string} destRoot - The root directory to prepend to each destination path in the group. This allows the group definition to specify destination paths relative to a common root, and also ensures that all copies are contained within a specific directory (e.g. the build output).
 * @returns {void}
 */
function copyGroup(group, sourceRoot, destRoot) {
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
    source = source.map(function (/** @type {string} **/ val) { // root the paths
        // shelljs 0.10 uses fast-glob which treats backslashes as escape characters
        return path.join(sourceRoot, val).split(path.sep).join('/');
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

/**
 * Copy groups of files from a source root to a destination root, with support for options and culture-specific expansion.
 * See copyGroup for details on the supported structure of each group.
 * @param {Object[]} groups - An array of group objects, each specifying a "source" (string or array of strings), an optional "dest" (string), and optional "options" (string) for the shell.cp command. Groups with a "dest" containing "<CULTURE_NAME>" will be automatically expanded for each culture in the predefined cultures list.
 * @param {string} sourceRoot - The root directory to prepend to each source path in the groups. This allows the group definitions to specify paths relative to a common root.
 * @param {string} destRoot - The root directory to prepend to each destination path in the groups. This allows the group definitions to specify destination paths relative to a common root, and also ensures that all copies are contained within a specific directory (e.g. the build output).
 */
function copyGroups(groups, sourceRoot, destRoot) {
    groups.forEach(function (group) {
        copyGroup(group, sourceRoot, destRoot);
    })
}

/**
 * Create resjson files from lib.json files, with support for culture-specific translations.
 * @param {Function} callback - A callback function to be invoked upon completion.
 */
function createResjson(callback) {
    try {
        shell.find('Extensions')
            .filter((file) => file.match(/(\/|\\)lib\.json$/))
            .map((file) => path.resolve(file))
            .forEach(function (libJson) {
                console.log('Generating resJson for ' + libJson);

                // create a key->value map of the default strings
                var defaultStrings = {};
                var lib = JSON.parse(fs.readFileSync(libJson, 'utf-8'));

                if (lib.messages) {
                    for (var key of Object.keys(lib.messages)) {
                        // skip resjson-style comments for localizers
                        if (!key || key.match(/^_.+\.comment$/)) {
                            continue;
                        }

                        // @ts-ignore - the defaultStrings object is being initialized with keys in the format "loc.messages.{key}", which matches the expected structure for localization resources in resjson files, and the values are taken from the corresponding entries in the lib.messages object.
                        defaultStrings[`loc.messages.${key}`] = lib.messages[key];
                    }
                }

                // create the culture-specific resjson files
                for (var culture of cultures) {
                    // initialize the culture-specific strings from the default strings
                    var cultureStrings = {};
                    for (var key of Object.keys(defaultStrings)) {
                        // @ts-ignore - the cultureStrings object is being initialized with the same keys and values as defaultStrings, which serves as the base for overlaying culture-specific translations from the xliff file. This ensures that any strings not translated in the xliff will fall back to the default string value.
                        cultureStrings[key] = defaultStrings[key];
                    }

                    // load the culture-specific xliff file
                    var xliffPath = path.join(path.dirname(libJson), 'xliff', `${culture}.xlf`);
                    var stats;

                    try {
                        stats = fs.statSync(xliffPath);
                    } catch (err) {
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
                        // @ts-ignore - the xliff structure is expected to have a single file with a
                        for (var unit of xliff.xliff.file[0].body[0]['trans-unit']) {
                            // @ts-ignore - the xliff structure is expected
                            if (unit.target[0].$.state == 'translated' && defaultStrings.hasOwnProperty(unit.$.id) && defaultStrings[unit.$.id] == unit.source[0]) {
                                // @ts-ignore - the unit id corresponds to the key in the defaultStrings map, and the target text is the translated value to use in the resjson
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
    } catch (err) {
        console.log('error:' + err.message);
        callback(new Error('compileTasks: ' + err.message));
        throw err;
    }
}

/**
 * Run npm install for a given package path, using a .npmrc file from the source directory to ensure consistent registry and authentication settings.
 * This is necessary for packages like ArtifactEngine that have their own node_modules and dependencies that must be installed as part of the build process.
 * @param {string} packagePath - The path to the package where npm install should be run.
 * @param {string} sourcePath - The path to the source directory containing the .npmrc file.
 */
function runNpmInstall(packagePath, sourcePath) {
    var originalDir = shell.pwd();
    util.cd(packagePath);
    var packageJsonPath = util.rp('package.json');
    if (util.test('-f', packageJsonPath)) {
        util.run(`npm ci --userconfig ${path.join(__dirname, sourcePath, ".npmrc")}`);
    }
    util.cd(originalDir);
}

/**
 * Compile UI extension TypeScript files. This is necessary because UI extensions are consumed as source and must be transpiled to JavaScript in the build output.
 * The function looks for a tsconfig.json file in the UIExtensions folder of the given extension root, and if found,
 * uses it to compile all .ts files in that folder (and subfolders) to JavaScript, outputting them to the same location.
 * @param {string} extensionRoot - The root folder of the extension within the Extensions directory (e.g. "MyExtension" for an extension located at Extensions/MyExtension).
 * @returns {NodeJS.ReadableStream | void} - A gulp stream if compilation was performed, or undefined if no tsconfig.json was found and compilation was skipped.
 */
function compileUIExtensions(extensionRoot) {
    var uiExtensionsPath = path.join(_buildRoot, "Extensions", extensionRoot, 'Src', 'UIExtensions');
    var tsconfigPath = path.join(uiExtensionsPath, "tsconfig.json");

    if (fs.existsSync(tsconfigPath)) {
        var projLocal = gts.createProject(tsconfigPath, { typescript: typescript });
        var tsLocal = gts(projLocal);
        var uiFilePath = path.join(uiExtensionsPath, '**/**/*.ts');
        return gulp.src([uiFilePath])
            .pipe(tsLocal)
            .on('error', errorHandler)
            .pipe(gulp.dest(uiExtensionsPath));
    };

    return;
}

gulp.task("updateTestIds", function (cb) {
    if (options.test) {
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
                            // @ts-ignore - idProperty is either 'id' or 'extensionId', both of which are strings
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

gulp.task("syncVersions", function (cb) {
    if (!options.syncVersions) {
        cb();
        return;
    }

    if (('' + process.env['TF_BUILD']).toLowerCase() === 'true') {
        cb(new Error('--syncVersions is intended for local development only and cannot run in CI pipelines.'));
        return;
    }

    // Support comma-separated extension names (e.g. --syncVersions Ansible,IISWebAppDeploy)
    // Note: gulp's CLI replaces commas with spaces, so we split on both.
    var extensions = String(options.syncVersions).split(/[,\s]+/).map(function (name) {
        return name.trim();
    }).filter(Boolean);

    if (extensions.length === 0) {
        cb();
        return;
    }

    // Ensure Azure CLI is logged in before processing any extensions.
    // This runs once (not per-extension) and opens the browser if needed.
    console.log('Checking Azure CLI login...');
    var tokenResult = cp.spawnSync('az', [
        'account', 'get-access-token',
        '--resource', '499b84ac-1321-427f-aa17-267ca6975798',
        '--query', 'accessToken', '-o', 'tsv'
    ], { shell: true, stdio: ['inherit', 'pipe', 'pipe'] });

    if (tokenResult.status !== 0) {
        console.log('Azure CLI session expired or not logged in. Opening browser for login...');
        var loginResult = cp.spawnSync('az', ['login', '--output', 'none'], {
            shell: true,
            stdio: 'inherit'
        });
        if (loginResult.status !== 0) {
            cb(new Error(
                'Azure CLI login failed.\n' +
                'The --syncVersions flag requires Azure CLI to query Marketplace extension versions.\n' +
                'Ensure Azure CLI is installed (https://aka.ms/installazurecliwindows) and try again.'
            ));
            return;
        }
    }

    console.log('Azure CLI login OK');

    var scriptPath = path.join(__dirname, 'scripts', 'BumpExtensionVersion.ps1');

    // Run extensions sequentially to avoid concurrent process issues
    var index = 0;
    /** @type {string[]} */
    var failedExtensions = [];

    function processNext() {
        if (index >= extensions.length) {
            cb(failedExtensions.length > 0
                ? new Error('syncVersions failed for: ' + failedExtensions.join(', '))
                : undefined);
            return;
        }

        var extName = extensions[index++];

        var possiblePaths = [
            path.join(__dirname, 'Extensions', extName, 'Src', 'vss-extension.json'),
            path.join(__dirname, 'Extensions', extName, 'src', 'vss-extension.json'),
            path.join(__dirname, 'Extensions', extName, 'vss-extension.json')
        ];

        var manifestPath = null;
        for (var i = 0; i < possiblePaths.length; i++) {
            if (fs.existsSync(possiblePaths[i])) {
                manifestPath = possiblePaths[i];
                break;
            }
        }

        if (!manifestPath) {
            console.error('No vss-extension.json found for extension: ' + extName);
            failedExtensions.push(extName);
            processNext();
            return;
        }

        console.log('Syncing version for: ' + extName);
        var child = cp.execFile('pwsh', ['-NoProfile', '-File', scriptPath, '-ManifestPath', manifestPath], function (err) {
            if (err) {
                console.error('Version sync failed for: ' + extName);
                failedExtensions.push(extName);
            }
            processNext();
        });
        child.stdout?.pipe(process.stdout);
        child.stderr?.pipe(process.stderr);
    }

    processNext();
});

gulp.task("tscBuildTasks", function (cb) {
    const buildCheckList = JSON.parse(fs.readFileSync(path.join(__dirname, 'externals.json'), 'utf-8'))['tsc-build-check'];

    if (!buildCheckList || buildCheckList.length === 0) {
        cb();
        return;
    }

    const tscCliPath = require.resolve('typescript/bin/tsc');

    fs.readdirSync(ExtensionFolder, { recursive: true, encoding: 'utf-8' })
        .filter(x => buildCheckList.find((/** @type{string} */ check) => x.includes(check)) && path.parse(x).base == "tsconfig.json" && !x.includes("node_modules"))
        .map(x => path.resolve(ExtensionFolder, x))
        .forEach((configPath) => {
            const taskPath = path.dirname(configPath);

            try {
                pkgm.installDependencies(taskPath, path.basename(taskPath), path.join(taskPath, ".npmrc"));
                cp.execFileSync(process.execPath, [tscCliPath, '-p', configPath], { stdio: util.isDebug() ? 'inherit' : 'ignore' });
            } catch (err) {
                console.error(`TypeScript compilation failed for ${configPath}: ${err.message}`);
                console.error(`Execute manually the command:\nnpx tsc -p ${configPath}`);
                cb();
                errorHandler();
            }
        });
    cb();
});

/**
 * Map changed files to the audit roots they belong to. Each file is attributed
 * to the most specific (deepest) enclosing audit root so a change under an
 * extension task folder audits only that folder, not the repo root.
 * @param {string[]} files
 * @param {string[]} roots
 * @returns {string[]}
 */
function resolveAffectedAuditRoots(files, roots) {
    /** @type {Set<string>} */
    const selected = new Set();
    for (const f of files) {
        let best = null;
        let bestLen = -1;
        for (const root of roots) {
            const prefix = root === '.' ? '' : `${root}/`;
            if (f.startsWith(prefix) && prefix.length > bestLen) {
                best = root;
                bestLen = prefix.length;
            }
        }
        if (best !== null) selected.add(best);
    }
    return [...selected];
}

gulp.task("audit", (done) => {
    const roots = cp.execSync('git ls-files -- "*package.json"', { cwd: __dirname, encoding: 'utf-8' })
        .split('\n')
        .map((p) => p.trim())
        .map((p) => path.posix.dirname(p));

    const files = getChangedFiles(true);
    let affected;
    if (files === null) {
        console.log("Cannot determine changed files -> skip the check.");
        done();
        return;
    } else {
        affected = resolveAffectedAuditRoots(files, roots);
    }

    if (affected.length === 0) {
        console.log("No auditable roots affected by this change. Skipping npm audit.");
        done();
        return;
    }

    console.log(`Auditing affected roots (${affected.length}): ${affected.join(', ')}`);

    /** @type {string[]} */
    const failures = [];

    for (const root of affected) {
        const cwd = root === '.' ? __dirname : path.join(__dirname, root);
        console.log('\n========================================');
        console.log(`npm audit --audit-level=high in ${root}`);
        console.log('========================================');

        const result = cp.spawnSync('npm audit --audit-level=high', {
            cwd,
            stdio: 'inherit',
            env: process.env,
            shell: true
        });
        if (result.error) {
            console.error(`Failed to run npm audit in ${root}: ${result.error.message}`);
            failures.push(root);
        } else if (result.status !== 0) {
            failures.push(root);
        }
    }

    if (failures.length > 0) {
        done(new Error(`npm audit found high/critical vulnerabilities in: ${failures.join(', ')}`));
        return;
    }
    console.log('\nnpm audit passed for all affected roots.');
    done();
});

gulp.task("build", gulp.series("syncVersions", "compileNode", "tscBuildTasks", "updateTestIds", "audit"));

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
        .pipe(gulp.dest(_testRoot + "\\Extensions"))
        .on('error', errorHandler);
});

gulp.task('testLib', gulp.series('compileTests', function () {
    return gulp.src(['Extensions/Common/lib/**/*'], { encoding: false })
        .pipe(gulp.dest(path.join(_testRoot, 'Extensions/Common/lib/')));
}));

gulp.task('copyTestData', gulp.series('compileTests', function () {
    return gulp.src(['Extensions/**/Tests/**/data/**'], { dot: true, encoding: false })
        .pipe(gulp.dest(_testRoot + "\\Extensions"));
}));

gulp.task('tstests', gulp.series('compileTests', function () {
    return gulp.src(['Extensions/**/Tests/**/*.ts', 'Extensions/**/Tests/**/*.json', 'Extensions/**/Tests/**/*.js'])
        .pipe(gulp.dest(_testRoot + "\\Extensions"));
}));

gulp.task('ps1tests', gulp.series('compileTests', function () {
    return gulp.src(['Extensions/**/Tests/**/*.ps1', 'Extensions/**/Tests/**/*.json'])
        .pipe(gulp.dest(_testRoot + "\\Extensions"));
}));

gulp.task('testLib_NodeModules', gulp.series('testLib', function () {
    return gulp.src(path.join(__dirname, 'node_modules/azure-pipelines-task-lib/**/*'), { encoding: false })
        .pipe(gulp.dest(path.join(_testRoot, 'Extensions/Common/lib/node_modules/azure-pipelines-task-lib')));
}));

gulp.task('testResources', gulp.parallel('testLib_NodeModules', 'ps1tests', 'tstests', 'copyTestData'));

// Path to mocha CLI. With newer gulp-mocha versions, mocha is hoisted to the
// top-level node_modules rather than nested under gulp-mocha. Resolve it via
// require.resolve so we pick up whichever copy npm has installed.
var _mochaBin = path.join(path.dirname(require.resolve('mocha/package.json')), 'bin', '_mocha');

/**
 * Spawn mocha as a separate child Node process for a single logical "suite"
 * (one extension, or one ad-hoc file glob). This isolates module state — most
 * importantly, the global `nock`/`@mswjs/interceptors` HTTP patching done by
 * the ArtifactEngine integration tests — so suites that perform real HTTP
 * (e.g. Ansible's MockTestRunner downloading node.exe) aren't affected.
 * @param {string} label - a human-friendly label for logging purposes (e.g. the extension name, or "ArtifactEngine e2e") to identify the suite in logs and errors.
 * @param {string[]} patterns - an array of glob patterns to match test files to run in this suite (e.g. ["_suite.js"] to run a single file, or ["**\/*Tests.js"] to run all tests under an extension)
 * @param {string[] | undefined } ignorePatterns - an optional array of glob patterns to exclude from the matched test files (e.g. ["**\/UIContribution/**"] to exclude UIContribution tests that require special setup)
 * @returns {Promise<number>} - a Promise that resolves with the mocha process's exit code (0 for success, nonzero for failure)
 */
function runMochaSuite(label, patterns, ignorePatterns) {
    var glob = require('glob');
    var tfBuild = ('' + process.env['TF_BUILD']).toLowerCase() == 'true';

    // glob requires forward-slash patterns even on Windows.
    var toPosix = function (/** @type {string} */ p) { return String(p).replace(/\\/g, '/'); };
    var posixIgnores = (ignorePatterns || []).map(toPosix);
    // Always exclude node_modules: dependencies sometimes ship their own
    // *tests.js files (e.g. safer-buffer) that we must not run.
    posixIgnores.push('**/node_modules/**');

    /** @type {string[]} */
    var files = [];
    var seen = {};
    (patterns || []).forEach(function (p) {
        // nocase:false to keep `*Tests.js` (capital T) from matching
        // dependency files like `tests.js` on case-insensitive filesystems.
        var matches = glob.sync(toPosix(p), { ignore: posixIgnores, nocase: false });
        matches.forEach(function (m) {
            // Normalize back to native separators for spawn args.
            var native = m.split('/').join(path.sep);
            // @ts-ignore - guard against duplicates in the glob results, which would cause mocha to run the same file multiple times and skew results (e.g. if both "Extensions/**\/*Tests.js" and "Extensions/MyExt/**/*Tests.js" are included, files under MyExt would be duplicated). Use a Set if we can assume Node 12+.
            if (!seen[native]) { seen[native] = true; files.push(native); }
        });
    });

    // Sort the resolved files to keep load order deterministic across platforms.
    // This matters because some suites (e.g. ArtifactEngine ProvidersTests) call
    // libMocker.enable({useCleanCache:true}) at module top level with an `fs`
    // mock that is missing methods (writeFileSync). azure-pipelines-task-lib's
    // task.js only initializes its Vault on first load (gated by
    // global['_vsts_task_lib_loaded']); if a non-mocking test file (e.g.
    // jenkinsTests) loads first it sets that flag, and the subsequent re-load
    // through the cleared cache becomes a no-op. The previous gulp-mocha based
    // pipeline relied on alphabetical glob order for this; preserve it.
    files.sort();

    console.log('\n========================================');
    console.log('Running mocha suite: ' + label);
    (patterns || []).forEach(function (p) { console.log('  pattern: ' + p); });
    (ignorePatterns || []).forEach(function (p) { console.log('  ignore : ' + p); });
    console.log('  resolved files: ' + files.length);
    console.log('========================================');

    if (files.length === 0) {
        console.log('No test files matched for suite ' + label + '; skipping.');
        return Promise.resolve(0);
    }

    var args = [_mochaBin, '--reporter', 'spec', '--ui', 'bdd'];
    if (tfBuild) {
        args.push('--no-colors');
    }
    args = args.concat(files);

    return new Promise(function (resolve) {
        var child = cp.spawn(process.execPath, args, {
            stdio: 'inherit',
            env: process.env,
            cwd: __dirname
        });
        child.on('exit', function (code) { resolve(code == null ? 1 : code); });
        child.on('error', function (err) {
            console.error('Failed to spawn mocha for suite ' + label + ': ' + err.message);
            resolve(1);
        });
    });
}

/**
 * Run a list of suites sequentially (do NOT fast-fail; we want a complete CI signal).
 * @param {{ label: string, patterns: string[], ignorePatterns?: string[] }[]} suites - An array of suite definitions, each with a label for logging, an array of glob patterns to match test files, and an optional array of glob patterns to ignore.
 * @returns {Promise<void>} - a Promise that resolves when all suites have completed, with an error if any suite failed.
 */
async function runMochaSuitesSequentially(suites) {
    /** @type {{ label: string, code: number }[]} */
    var failures = [];
    var p = Promise.resolve();
    suites.forEach(function (s) {
        p = p.then(function () {
            return runMochaSuite(s.label, s.patterns, s.ignorePatterns).then(function (code) {
                if (code !== 0) {
                    failures.push({ label: s.label, code: code });
                }
            });
        });
    });

    return p.then(function () {
        if (failures.length > 0) {
            console.error('\n' + failures.length + ' mocha suite(s) failed:');
            failures.forEach(function (f) { console.error('  - ' + f.label + ' (exit code ' + f.code + ')'); });
            throw new Error('Mocha test failures: ' + failures.map(function (f) { return f.label; }).join(', '));
        }
    });
}

// Returns the list of test-bearing extension names found under _build/Extensions.
// We look at the built copy (the same place Mocha would load from) so that the
// list matches what's actually runnable.
function discoverBuiltTestBearingExtensions() {
    var builtExtensionsRoot = path.join(__dirname, _testRoot, 'Extensions');
    if (!fs.existsSync(builtExtensionsRoot)) return [];
    return fs.readdirSync(builtExtensionsRoot).filter(function (name) {
        var dir = path.join(builtExtensionsRoot, name);
        if (!fs.statSync(dir).isDirectory()) return false;
        return fs.existsSync(path.join(dir, 'Tests')) || fs.existsSync(path.join(dir, 'EngineTests'));
    });
}

gulp.task("test", gulp.series("testResources", function () {
    process.env['TASK_TEST_TEMP'] = path.join(__dirname, _testTemp);
    shell.rm('-rf', _testTemp);
    shell.mkdir('-p', _testTemp);

    // ArtifactEngine --e2e and --perf are ad-hoc, single-suite invocations.
    // They keep their original glob and just go through the per-process helper.
    if (options.suite.indexOf("ArtifactEngine") >= 0 && options.e2e) {
        var e2ePath = path.join(_testRoot, "Extensions/" + options.suite + "/**/*e2e.js");
        return runMochaSuitesSequentially([
            { label: options.suite + ' (e2e)', patterns: [e2ePath] }
        ]);
    }

    if (options.suite.indexOf("ArtifactEngine") >= 0 && options.perf) {
        var perfPath = path.join(_testRoot, "Extensions/" + options.suite + "/**/*perf.js");
        return runMochaSuitesSequentially([
            { label: options.suite + ' (perf)', patterns: [perfPath] }
        ]);
    }

    var selectedSuites = resolveSuitesToRun();
    var ignorePatterns = [path.join(_testRoot, "Extensions", "**/UIContribution/**")];

    var extensionsToRun;
    if (selectedSuites === null) {
        // "run all" sentinel: enumerate every test-bearing extension and run
        // each in its own mocha child process so module state doesn't leak
        // between suites.
        extensionsToRun = discoverBuiltTestBearingExtensions();
        console.log("Running all suites: " + extensionsToRun.join(', '));
    } else if (selectedSuites.length === 0) {
        console.log("No test-bearing extensions affected by this change. Skipping mocha run.");
        return Promise.resolve();
    } else {
        extensionsToRun = selectedSuites;
    }

    var suites = extensionsToRun.map(function (name) {
        return {
            label: name,
            patterns: [
                // Match any _suite.js under the extension's Tests/Tasks tree
                // (some extensions have nested per-version subfolders).
                path.join(_testRoot, "Extensions", name, "Tests/Tasks/**/_suite.js"),
                path.join(_testRoot, "Extensions", name, "**/*Tests.js")
            ],
            ignorePatterns: ignorePatterns
        };
    });

    return runMochaSuitesSequentially(suites);
}));

// ---------------------------------------------------------------------------
// Shared git-diff logic
// ---------------------------------------------------------------------------

/**
 * Returns an array of changed file paths (forward-slash normalized) from the
 * diff against the target branch. Works for PR builds (uses PR target) and
 * manual/CI builds (diffs selected branch against master).
 * Returns null only if the diff cannot be determined (fetch failure, etc.).
 * @param {boolean} [filterLocalChanges] - When true and BUILD_SOURCEBRANCH is not set (local runs), resolve the current branch via `git rev-parse --abbrev-ref HEAD` so the diff can still be computed; returns null (run all) if it can't be resolved. When false, the local branch fallback is skipped and such runs return null (run all).
 * @returns {string[] | null} The list of changed files, or null if the diff cannot be determined (e.g. fetch failure, no target branch, etc.).
 */
function getChangedFiles(filterLocalChanges) {
    var buildReason = process.env['BUILD_REASON'];
    var target;

    if (buildReason === 'PullRequest') {
        var prTarget = process.env['SYSTEM_PULLREQUEST_TARGETBRANCH'];
        if (!prTarget) {
            console.log("PR build but no target branch set -> running all.");
            return null;
        }
        target = prTarget.replace(/^refs\/heads\//, '');
    } else {
        // Manual or CI trigger — diff current branch against master.
        target = 'master';
        var sourceBranch = (process.env['BUILD_SOURCEBRANCH'] || '').replace(/^refs\/heads\//, '');
        if (!sourceBranch && filterLocalChanges) {
            try {
                sourceBranch = cp.execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
            } catch (e) {
                console.log("Could not resolve current git branch: " + e.message + " -> running all.");
                return null;
            }
        }
        if (!sourceBranch || sourceBranch === target) {
            console.log("Source branch is " + (sourceBranch || 'empty') + " (target: " + target + ") -> running all.");
            return null;
        }
        console.log("Non-PR build (BUILD_REASON=" + (buildReason || 'local') + "). Diffing against " + target + ".");
    }
    var changedFiles;
    try {
        // Deepen modestly so the merge-base is reachable for 3-dot diff even on shallow (depth=1) clones.
        cp.execSync('git fetch --no-tags --quiet --depth=200 origin ' + target + ':refs/remotes/origin/' + target, { stdio: ['ignore', 'ignore', 'pipe'] });
    } catch (e) {
        console.log("Warning: git fetch of origin/" + target + " failed: " + e.message + " -> running all suites.");
        return null;
    }
    try {
        changedFiles = cp.execSync('git diff --name-only origin/' + target + '...HEAD', { encoding: 'utf8' });
    } catch (e3) {
        try {
            console.log("3-dot diff failed (" + e3.message.split('\n')[0] + "); falling back to 2-dot.");
            changedFiles = cp.execSync('git diff --name-only origin/' + target + ' HEAD', { encoding: 'utf8' });
        } catch (e2) {
            console.log("Warning: git diff failed: " + e2.message + " -> running all suites.");
            return null;
        }
    }
    var files = changedFiles.split(/\r?\n/).filter(function (l) { return l.length > 0; }).map(function (f) { return f.replace(/\\/g, '/'); });
    console.log("Changed files (" + files.length + "):");
    files.forEach(function (f) { console.log("  " + f); });
    return files;
}

const SHARED_INFRA_PREFIXES = [
    'Extensions/Common/',
    'Extensions/ArtifactEngine/',
    'Extensions/ArtifactEngineV2/',
    'common.json',
    'externals.json',
    'package.json',
    'package-lock.json',
    'package.js',
    'package-utils.js',
    'base.tsconfig.json',
    'tsconfig.json',
    'gulpfile.js',
    'definitions/',
    'TaskModules/',
    'scripts/',
    '.pipelines/',
    'ci/'
];
const SHARED_INFRA_IGNORE_EXTENSIONS = ['.md', '.txt', '.png', '.jpg', '.gif'];

/**
 * Returns true if any changed file touches shared infrastructure.
 * Documentation and image files (.md, .txt, .png, .jpg, .gif) are excluded.
 * @param {string[]} files
 * @returns {boolean}
 */
function hitsSharedInfra(files) {
    return files.some(function (f) {
        var dotIndex = f.lastIndexOf('.');
        if (dotIndex >= 0 && SHARED_INFRA_IGNORE_EXTENSIONS.indexOf(f.substring(dotIndex).toLowerCase()) >= 0) return false;
        return SHARED_INFRA_PREFIXES.some(function (p) { return f === p || f.indexOf(p) === 0; });
    });
}

/**
 * Given changed files and a filter function, returns matched extension names.
 * Returns null if shared infrastructure changed (caller decides semantics).
 * @param {string[]} files
 * @param {function(string): boolean} filterFn
 * @returns {string[] | null}
 */
function resolveChangedExtensions(files, filterFn) {
    if (hitsSharedInfra(files)) {
        console.log("Shared infrastructure changed -> returning null (all).");
        return null;
    }
    /** @type {{ [key: string]: boolean }} */
    var selected = {};
    files.forEach(function (f) {
        var m = f.match(/^Extensions\/([^\/]+)\//);
        if (!m) return;
        var ext = m[1];
        if (filterFn(ext)) selected[ext] = true;
    });
    return Object.keys(selected);
}

// Discover extensions that have Src/vss-extension.json (publishable to marketplace).
function discoverPublishableExtensions() {
    var extensionsRoot = path.join(__dirname, 'Extensions');
    return fs.readdirSync(extensionsRoot).filter(function (name) {
        var dir = path.join(extensionsRoot, name);
        if (!fs.statSync(dir).isDirectory()) return false;
        return fs.existsSync(path.join(dir, 'Src', 'vss-extension.json'));
    });
}

// ---------------------------------------------------------------------------
// resolveSuitesToRun — used by `gulp test` to pick mocha suites
// ---------------------------------------------------------------------------

// Returns:
//   null  -> caller should run ALL suites (default mocha glob, behavior unchanged)
//   []    -> filter resolved to no extensions; caller should skip mocha entirely
//   [...] -> exact list of extension names to test
function resolveSuitesToRun() {
    if (String(options.runAllSuites).toLowerCase() === 'true') {
        console.log("runAllSuites=true -> running all suites.");
        return null;
    }

    const files = getChangedFiles();

    if (files === null) {
        console.log("-> running all suites.");
        return null;
    }

    // Auto-discover test-bearing extensions: subdirs of Extensions/ that contain a Tests or EngineTests folder.
    const extensionsRoot = path.join(__dirname, 'Extensions');
    const testBearing = fs.readdirSync(extensionsRoot).filter(function (name) {
        const dir = path.join(extensionsRoot, name);
        if (!fs.statSync(dir).isDirectory()) return false;
        return fs.existsSync(path.join(dir, 'Tests')) || fs.existsSync(path.join(dir, 'EngineTests'));
    });
    console.log("Discovered test-bearing extensions: " + testBearing.join(', '));
    const result = resolveChangedExtensions(files, function (/** @type {string} */ ext) {
        return testBearing.indexOf(ext) >= 0;
    });

    if (result === null) {
        console.log("-> running all suites.");
        return null;
    }
    console.log("Selected suites: " + (result.length ? result.join(', ') : '(none)'));
    return result;
}

// ---------------------------------------------------------------------------
// gulp detectChangedExtensions — used by CI pipeline to find publishable exts
// ---------------------------------------------------------------------------

gulp.task("detectChangedExtensions", function (done) {
    const publishable = discoverPublishableExtensions();
    console.log("Publishable extensions: " + publishable.join(', '));

    const files = getChangedFiles();
    let extensions;

    if (files === null) {
        console.log("Cannot determine changed files -> returning all publishable extensions.");
        extensions = publishable;
    } else {
        const result = resolveChangedExtensions(files, function (/** @type {string} */ ext) {
            return publishable.indexOf(ext) >= 0;
        });

        if (result === null) {
            console.log("Shared infra changed -> returning all publishable extensions.");
            extensions = publishable;
        } else {
            extensions = result;
        }
    }

    var extensionList = extensions.join(';');
    var hasChanges = extensions.length > 0 ? 'true' : 'false';

    console.log("\nDetected extensions (" + extensions.length + "): " + extensions.join(', '));
    console.log("\nSetting pipeline variables:");
    console.log("  DetectedExtensions   = " + extensionList);
    console.log("##vso[task.setvariable variable=DetectedExtensions]" + extensionList);
    console.log("##vso[task.setvariable variable=DetectedExtensions;isOutput=true]" + extensionList);
    console.log("  HasExtensionChanges  = " + hasChanges);
    console.log("##vso[task.setvariable variable=HasExtensionChanges]" + hasChanges);
    console.log("##vso[task.setvariable variable=HasExtensionChanges;isOutput=true]" + hasChanges);
    done();
});

//-----------------------------------------------------------------------------------------------------------------
// Package
//-----------------------------------------------------------------------------------------------------------------

gulp.task("package", function (cb) {
    // use gulp package --extension=<Extension_Name> to package an individual package
    if (options.extension) {
        createVsixPackage(options.extension);
        cb();
        return;
    }

    fs.readdirSync(_extnBuildRoot).filter(function (file) {
        return fs.statSync(path.join(_extnBuildRoot, file)).isDirectory() && file != "Common";
    }).forEach(createVsixPackage);
    cb();
});

/**
 * Copies common modules to the given extension's build output folder based on the dependencies specified in common.json. This is used as part of the packaging process to ensure that each extension has the common modules it depends on included in its vsix package.
 * @param {string} extensionName - The name of the extension to copy common modules for. This should match the folder name under Extensions/ and _build/Extensions/.
 * @returns {NodeJS.ReadWriteStream} A gulp stream that copies the common modules to the extension's build output folder.
 */
function copyCommonModules(extensionName) {
    var commonDeps = require('./common.json');
    var commonSrc = path.join(__dirname, 'Extensions/Common');
    var currentExtnRoot = path.join(__dirname, "_build/Extensions", extensionName);
    const extensionSourcePath = path.join(__dirname, "Extensions", extensionName);
    return gulp.src(path.join(currentExtnRoot, '**/task.json'))
        .pipe(pkgm.copyCommonModules(currentExtnRoot, commonDeps, commonSrc, extensionSourcePath));
}

/**
 * Creates a vsix package for the given extension name by invoking tfx CLI. The extension is expected to be already built and have a vss-extension.json manifest under its Src folder.
 * @param {string} extensionName - Name of the extension to package, which should match the folder name under Extensions/ and _build/Extensions/
 */
function createVsixPackage(extensionName) {
    const extnOutputPath = path.join(_packageRoot, extensionName);
    const extnManifestPath = path.join(_extnBuildRoot, extensionName, "Src");

    if (fs.existsSync(extnManifestPath)) {
        fs.rmSync(extnOutputPath, { recursive: true, force: true });

        if (options.publisher) {
            const extensionManifestPath = path.join(extnManifestPath, "vss-extension.json");
            console.log(`🔁 Updating publisher in manifest for ${extensionManifestPath} to "${options.publisher}"`);
            const manifest = JSON.parse(fs.readFileSync(extensionManifestPath, 'utf8'));
            manifest.publisher = options.publisher;
            fs.writeFileSync(extensionManifestPath, JSON.stringify(manifest));
        }

        console.log(`📦 Packaging extension: ${extensionName}`);
        shell.mkdir("-p", extnOutputPath);

        const packagingArgs = ["extension", "create", "--manifest-globs", "vss-extension.json", "--root", extnManifestPath, "--output-path", extnOutputPath];
        const packagingResult = cp.spawnSync("tfx", packagingArgs, { stdio: "pipe", shell: true });
        if (packagingResult.status !== 0) {
            const stderr = packagingResult.stderr ? packagingResult.stderr.toString() : "";
            throw new Error(`command failed: tfx ${packagingArgs.join(" ")}\n${stderr}`);
        }

        console.log(`✅ Packaged extension: ${extensionName}`);
    }
}

/**
 * Caches an archive file from the given URL by downloading and extracting it to a temp directory. If the file has already been cached, the cached path is returned.
 * @param {string} url - The URL of the archive file to cache. The URL is expected to be unique for different files (e.g. by including a version query parameter) since the caching is based on the URL.
 * @returns {string} The local path to the cached and extracted archive file. The caller can expect the archive contents to be extracted to this path (i.e. the path is not the zip file itself but the extracted directory).
 */
function cacheArchiveFile(url) {
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

/**
 * Caches an npm package by running npm install for the given package name and version, and extracting the installed package from the npm cache to a temp directory. If the package has already been cached, the cached path is returned.
 * @param {string} name - The name of the npm package to cache. This is expected to be the exact package name as it would be passed to npm install (e.g. "typescript" or "@types/node").
 * @param {string} version - The version of the npm package to cache. This is expected to be the exact version as it would be passed to npm install (e.g. "4.5.2" or "^4.5.0"). Note that npm install will resolve version ranges to specific versions, and the caching is based on the resolved version, so different version ranges that resolve to the same version will hit the cache after the first install.
 * @returns {string | void} The local path to the cached npm package. The caller can expect the package contents to be available under a "node_modules" subdirectory of this path (e.g. if caching "typescript@4.5.2", the file "typescript.d.ts" would be expected to be found at "<cached_path>/node_modules/typescript/lib/typescript.d.ts").
 */
function cacheNpmPackage(name, version) {
    // Validate the parameters.
    if (!name) {
        throw new Error('Parameter "name" cannot be null or empty.');
    }

    if (!version) {
        throw new Error('Parameter "version" cannot be null or empty.');
    }

    // Short-circuit if already downloaded.
    console.log('Downloading npm package ' + name + '@' + version);
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
    const versionOutput = cp.execSync('"' + npmPath + '" --version');
    const npmVersion = versionOutput.toString().replace(/[\n\r]+/g, '')
    console.log(`npm version: ${npmVersion}`);

    // Make a node_modules directory. Otherwise the modules will be installed in a node_modules
    // directory further up the directory hierarchy.
    shell.mkdir('-p', path.join(partialPath, 'node_modules'));

    // Run npm install.
    shell.pushd(partialPath);
    try {
        const cmdline = '"' + npmPath + '" install ' + name + '@' + version + ' --userconfig ' + path.join(__dirname, ".npmrc");
        const result = cp.execSync(cmdline);

        // @ts-ignore
        if (result.status > 0) {
            // @ts-ignore
            throw new Error('npm failed with exit code ' + result.status);
        }
    } finally {
        shell.popd();
    }

    // Move the intermediate directory to the target location.
    shell.mkdir('-p', path.dirname(targetPath));
    shell.mv(partialPath, targetPath);
}

/**
 * Caches a NuGet V2 package by downloading the package from the given repository URL with the specified name and version, and extracting the package contents to a temp directory. If the package has already been cached, the cached path is returned.
 * @param {string} repository - The base URL of the NuGet V2 repository to download the package from. This is expected to be a valid NuGet V2 feed URL that supports querying packages by ID and version (e.g. "https://api.nuget.org/v3/legacy/packages").
 * @param {string} name - The name of the NuGet package to cache. This is expected to be the exact package ID as it would be passed in a NuGet query (e.g. "Newtonsoft.Json").
 * @param {string} version - The version of the NuGet package to cache. This is expected to be the exact version as it would be passed in a NuGet query (e.g. "12.0.3"). Note that NuGet queries will resolve version ranges to specific versions, and the caching is based on the resolved version, so different version ranges that resolve to the same version will hit the cache after the first download.
 * @returns {string} The local path to the cached NuGet package. The caller can expect the package contents to be extracted to this path (i.e. the path is not the .nupkg file itself but the extracted directory).
 */
function cacheNuGetV2Package(repository, name, version) {
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