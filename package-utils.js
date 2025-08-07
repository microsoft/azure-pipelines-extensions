// this code is partitially copied from vsts-task repo

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ncp = require('child_process');

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