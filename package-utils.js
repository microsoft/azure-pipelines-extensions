// this code is partitially copied from vsts-task repo

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var ncp = require('child_process');

//------------------------------------------------------------------------------
// shell functions
//------------------------------------------------------------------------------
var rp = function (relPath) {
    return path.join(shell.pwd() + '', relPath);
}
exports.rp = rp;

var shellAssert = function () {
    var errMsg = shell.error();
    if (errMsg) {
        throw new Error(errMsg);
    }
}

var cd = function (dir) {
    shell.cd(dir);
    shellAssert();
}
exports.cd = cd;

var test = function (options, p) {
    var result = shell.test(options, p);
    shellAssert();
    return result;
}
exports.test = test;

var fail = function (message) {
    console.error('ERROR: ' + message);
    process.exit(1);
}
exports.fail = fail;

var run = function (cl, inheritStreams, noHeader) {
    if (!noHeader) {
        console.log();
        console.log('> ' + cl);
    }

    var options = {
        stdio: inheritStreams ? 'inherit' : 'pipe'
    };
    var rc = 0;
    var output;
    try {
        output = ncp.execSync(cl, options);
    }
    catch (err) {
        if (!inheritStreams) {
            console.error(err.output ? err.output.toString() : err.message);
        }

        process.exit(1);
    }

    return (output || '').toString().trim();
}
exports.run = run;

var buildNodeTask = function (taskPath, outDir) {
    var originalDir = shell.pwd();
    cd(taskPath);
    var packageJsonPath = rp('package.json');
    console.log("");
    if (test('-f', packageJsonPath)) {
        var packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
        if (packageJson.devDependencies && Object.keys(packageJson.devDependencies).length != 0) {
            fail('The package.json should not contain dev dependencies. Move the dev dependencies into a package.json file under the Tests sub-folder. Offending package.json: ' + packageJsonPath);
        }

        run('npm install');
    }
    cd(originalDir);
}
exports.buildNodeTask = buildNodeTask;