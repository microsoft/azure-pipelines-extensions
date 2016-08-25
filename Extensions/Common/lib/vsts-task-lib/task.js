/// <reference path="../../../../definitions/node.d.ts" />
"use strict";
const path = require('path');
const fs = require('fs');
const os = require('os');
const util = require('util');
const tcm = require('./taskcommand');
const trm = require('./toolrunner');
const mock = require('./mock');
(function (TaskResult) {
    TaskResult[TaskResult["Succeeded"] = 0] = "Succeeded";
    TaskResult[TaskResult["Failed"] = 1] = "Failed";
})(exports.TaskResult || (exports.TaskResult = {}));
var TaskResult = exports.TaskResult;
//-----------------------------------------------------
// String convenience
//-----------------------------------------------------
function startsWith(str, start) {
    return str.slice(0, start.length) == start;
}
function endsWith(str, start) {
    return str.slice(-str.length) == str;
}
//-----------------------------------------------------
// General Helpers
//-----------------------------------------------------
exports._outStream = process.stdout;
exports._errStream = process.stderr;
function _writeError(str) {
    exports._errStream.write(str + os.EOL);
}
exports._writeError = _writeError;
function _writeLine(str) {
    exports._outStream.write(str + os.EOL);
}
exports._writeLine = _writeLine;
function setStdStream(stdStream) {
    exports._outStream = stdStream;
}
exports.setStdStream = setStdStream;
function setErrStream(errStream) {
    exports._errStream = errStream;
}
exports.setErrStream = setErrStream;
//-----------------------------------------------------
// Results and Exiting
//-----------------------------------------------------
function setResult(result, message) {
    debug('task result: ' + TaskResult[result]);
    command('task.complete', { 'result': TaskResult[result] }, message);
    if (result == TaskResult.Failed) {
        _writeError(message);
    }
    if (result == TaskResult.Failed) {
        process.exit(0);
    }
}
exports.setResult = setResult;
//
// Catching all exceptions
//
process.on('uncaughtException', (err) => {
    setResult(TaskResult.Failed, 'Unhandled:' + err.message);
});
function exitOnCodeIf(code, condition) {
    if (condition) {
        setResult(TaskResult.Failed, 'failure return code: ' + code);
    }
}
exports.exitOnCodeIf = exitOnCodeIf;
//
// back compat: should use setResult
//
function exit(code) {
    setResult(code, 'return code: ' + code);
}
exports.exit = exit;
//-----------------------------------------------------
// Loc Helpers
//-----------------------------------------------------
var locStringCache = {};
var resourceFile;
var libResourceFileLoaded = false;
function loadLocStrings(resourceFile) {
    var locStrings = {};
    if (resourceFile && fs.existsSync(resourceFile)) {
        debug('load loc strings from: ' + resourceFile);
        var resourceJson = require(resourceFile);
        if (resourceJson && resourceJson.hasOwnProperty('messages')) {
            for (var key in resourceJson.messages) {
                if (typeof (resourceJson.messages[key]) === 'object') {
                    if (resourceJson.messages[key].loc && resourceJson.messages[key].loc.toString().length > 0) {
                        locStrings[key] = resourceJson.messages[key].loc.toString();
                    }
                    else if (resourceJson.messages[key].fallback) {
                        locStrings[key] = resourceJson.messages[key].fallback.toString();
                    }
                }
                else if (typeof (resourceJson.messages[key]) === 'string') {
                    locStrings[key] = resourceJson.messages[key];
                }
            }
        }
    }
    return locStrings;
}
function setResourcePath(path) {
    if (process.env['TASKLIB_INPROC_UNITS']) {
        resourceFile = null;
        libResourceFileLoaded = false;
        locStringCache = {};
    }
    if (!resourceFile) {
        resourceFile = path;
        debug('set resource file to: ' + resourceFile);
        var locStrs = loadLocStrings(resourceFile);
        for (var key in locStrs) {
            debug('cache loc string: ' + key);
            locStringCache[key] = locStrs[key];
        }
    }
    else {
        warning('resource file is already set to: ' + resourceFile);
    }
}
exports.setResourcePath = setResourcePath;
function loc(key) {
    // we can't do ...param if we target ES6 and node 5.  This is what <=ES5 compiles down to.
    var param = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        param[_i - 1] = arguments[_i];
    }
    if (!libResourceFileLoaded) {
        // merge loc strings from vsts-task-lib.
        var libResourceFile = path.join(__dirname, 'lib.json');
        var libLocStrs = loadLocStrings(libResourceFile);
        for (var libKey in libLocStrs) {
            debug('cache vsts-task-lib loc string: ' + libKey);
            locStringCache[libKey] = libLocStrs[libKey];
        }
        libResourceFileLoaded = true;
    }
    var locString;
    ;
    if (locStringCache.hasOwnProperty(key)) {
        locString = locStringCache[key];
    }
    else {
        if (!resourceFile) {
            warning('resource file haven\'t been set, can\'t find loc string for key: ' + key);
        }
        else {
            warning('can\'t find loc string for key: ' + key);
        }
        locString = key;
    }
    if (param.length > 0) {
        return util.format.apply(this, [locString].concat(param));
    }
    else {
        return locString;
    }
}
exports.loc = loc;
//-----------------------------------------------------
// Input Helpers
//-----------------------------------------------------
function getVariable(name) {
    var varval = process.env[name.replace(/\./g, '_').toUpperCase()];
    debug(name + '=' + varval);
    var mocked = mock.getResponse('getVariable', name);
    return mocked || varval;
}
exports.getVariable = getVariable;
function setVariable(name, val) {
    if (!name) {
        _writeError('name required: ' + name);
        exit(1);
    }
    var varValue = val || '';
    process.env[name.replace(/\./g, '_').toUpperCase()] = varValue;
    debug('set ' + name + '=' + varValue);
    command('task.setvariable', { 'variable': name || '' }, varValue);
}
exports.setVariable = setVariable;
function getInput(name, required) {
    var inval = process.env['INPUT_' + name.replace(' ', '_').toUpperCase()];
    if (required && !inval) {
        setResult(TaskResult.Failed, 'Input required: ' + name);
    }
    debug(name + '=' + inval);
    return inval;
}
exports.getInput = getInput;
function getBoolInput(name, required) {
    return getInput(name, required) == "true";
}
exports.getBoolInput = getBoolInput;
function setEnvVar(name, val) {
    if (val) {
        process.env[name] = val;
    }
}
exports.setEnvVar = setEnvVar;
//
// Split - do not use for splitting args!  Instead use arg() - it will split and handle
//         this is for splitting a simple list of items like targets
//
function getDelimitedInput(name, delim, required) {
    var inval = getInput(name, required);
    if (!inval) {
        return [];
    }
    return inval.split(delim);
}
exports.getDelimitedInput = getDelimitedInput;
function filePathSupplied(name) {
    // normalize paths
    var pathValue = this.resolve(this.getPathInput(name) || '');
    var repoRoot = this.resolve(this.getVariable('build.sourcesDirectory') || '');
    var supplied = pathValue !== repoRoot;
    debug(name + 'path supplied :' + supplied);
    return supplied;
}
exports.filePathSupplied = filePathSupplied;
function getPathInput(name, required, check) {
    var inval = getInput(name, required);
    if (inval) {
        if (check) {
            checkPath(inval, name);
        }
        if (inval.indexOf(' ') > 0) {
            if (!startsWith(inval, '"')) {
                inval = '"' + inval;
            }
            if (!endsWith(inval, '"')) {
                inval += '"';
            }
        }
    }
    else if (required) {
        setResult(TaskResult.Failed, 'Input required: ' + name); // exit
    }
    debug(name + '=' + inval);
    return inval;
}
exports.getPathInput = getPathInput;
//-----------------------------------------------------
// Endpoint Helpers
//-----------------------------------------------------
function getEndpointUrl(id, optional) {
    var urlval = getVariable('ENDPOINT_URL_' + id);
    debug(id + '=' + urlval);
    if (!optional && !urlval) {
        _writeError('Endpoint not present: ' + id);
        exit(1);
    }
    return urlval;
}
exports.getEndpointUrl = getEndpointUrl;
function getEndpointDataParameter(id, key, optional) {
    var dataParam = getVariable('ENDPOINT_DATA_' + id + '_' + key.toUpperCase());
    debug(id + '=' + dataParam);
    if (!optional && !dataParam) {
        _writeError('Endpoint data not present: ' + id);
        exit(1);
    }
    return dataParam;
}
exports.getEndpointDataParameter = getEndpointDataParameter;
function getEndpointAuthorizationScheme(id, optional) {
    var authScheme = getVariable('ENDPOINT_AUTH_SCHEME_' + id);
    debug(id + '=' + authScheme);
    if (!optional && !authScheme) {
        _writeError('Endpoint auth not present: ' + id);
        exit(1);
    }
    return authScheme;
}
exports.getEndpointAuthorizationScheme = getEndpointAuthorizationScheme;
function getEndpointAuthorizationParameter(id, key, optional) {
    var authParam = getVariable('ENDPOINT_AUTH_PARAMETER_' + id + '_' + key.toUpperCase());
    debug(id + '=' + authParam);
    if (!optional && !authParam) {
        _writeError('Endpoint auth not present: ' + id);
        exit(1);
    }
    return authParam;
}
exports.getEndpointAuthorizationParameter = getEndpointAuthorizationParameter;
function getEndpointAuthorization(id, optional) {
    var aval = getVariable('ENDPOINT_AUTH_' + id);
    debug(id + '=' + aval);
    if (!optional && !aval) {
        setResult(TaskResult.Failed, 'Endpoint not present: ' + id);
    }
    var auth;
    try {
        auth = JSON.parse(aval);
    }
    catch (err) {
        setResult(TaskResult.Failed, 'Invalid endpoint auth: ' + aval); // exit
    }
    return auth;
}
exports.getEndpointAuthorization = getEndpointAuthorization;
//-----------------------------------------------------
// Fs Helpers
//-----------------------------------------------------
class FsStats {
    setAnswers(mockResponses) {
        this.m_isFile = mockResponses['isFile'] || false;
        this.m_isDirectory = mockResponses['isDirectory'] || false;
        this.m_isBlockDevice = mockResponses['isBlockDevice'] || false;
        this.m_isCharacterDevice = mockResponses['isCharacterDevice'] || false;
        this.m_isSymbolicLink = mockResponses['isSymbolicLink'] || false;
        this.m_isFIFO = mockResponses['isFIFO'] || false;
        this.m_isSocket = mockResponses['isSocket'] || false;
        this.dev = mockResponses['dev'];
        this.ino = mockResponses['ino'];
        this.mode = mockResponses['mode'];
        this.nlink = mockResponses['nlink'];
        this.uid = mockResponses['uid'];
        this.gid = mockResponses['gid'];
        this.rdev = mockResponses['rdev'];
        this.size = mockResponses['size'];
        this.blksize = mockResponses['blksize'];
        this.blocks = mockResponses['blocks'];
        this.atime = mockResponses['atime'];
        this.mtime = mockResponses['mtime'];
        this.ctime = mockResponses['ctime'];
        this.m_isSocket = mockResponses['isSocket'];
    }
    isFile() {
        return this.m_isFile;
    }
    isDirectory() {
        return this.m_isDirectory;
    }
    isBlockDevice() {
        return this.m_isBlockDevice;
    }
    isCharacterDevice() {
        return this.m_isCharacterDevice;
    }
    isSymbolicLink() {
        return this.m_isSymbolicLink;
    }
    isFIFO() {
        return this.m_isFIFO;
    }
    isSocket() {
        return this.m_isSocket;
    }
}
exports.FsStats = FsStats;
function stats(path) {
    var fsStats = new FsStats();
    fsStats.setAnswers(mock.getResponse('stats', path) || {});
    return fsStats;
}
exports.stats = stats;
function exist(path) {
    return mock.getResponse('exist', path) || false;
}
exports.exist = exist;
function writeFile(file, data, options) {
    //do nothing
}
exports.writeFile = writeFile;
function osType() {
    return mock.getResponse('osType', 'osType');
}
exports.osType = osType;
function cwd() {
    return mock.getResponse('cwd', 'cwd');
}
exports.cwd = cwd;
//-----------------------------------------------------
// Cmd Helpers
//-----------------------------------------------------
function command(command, properties, message) {
    var taskCmd = new tcm.TaskCommand(command, properties, message);
    _writeLine(taskCmd.toString());
}
exports.command = command;
function warning(message) {
    command('task.issue', { 'type': 'warning' }, message);
}
exports.warning = warning;
function error(message) {
    command('task.issue', { 'type': 'error' }, message);
}
exports.error = error;
function debug(message) {
    command('task.debug', null, message);
}
exports.debug = debug;
var _argStringToArray = function (argString) {
    var args = argString.match(/([^" ]*("[^"]*")[^" ]*)|[^" ]+/g);
    for (var i = 0; i < args.length; i++) {
        args[i] = args[i].replace(/"/g, "");
    }
    return args;
};
function cd(path) {
}
exports.cd = cd;
function pushd(path) {
}
exports.pushd = pushd;
function popd() {
}
exports.popd = popd;
//------------------------------------------------
// Validation Helpers
//------------------------------------------------
function checkPath(p, name) {
    debug('check path : ' + p);
    if (!p || !mock.getResponse('checkPath', p)) {
        setResult(TaskResult.Failed, 'not found ' + name + ': ' + p); // exit
    }
}
exports.checkPath = checkPath;
//-----------------------------------------------------
// Shell/File I/O Helpers
// Abstract these away so we can
// - default to good error handling
// - inject system.debug info
// - have option to switch internal impl (shelljs now)
//-----------------------------------------------------
function mkdirP(p) {
    debug('creating path: ' + p);
}
exports.mkdirP = mkdirP;
function resolve() {
    // we can't do ...param if we target ES6 and node 5.  This is what <=ES5 compiles down to.
    //return the posix implementation in the mock, so paths will be consistent when L0 tests are run on Windows or Mac/Linux
    var absolutePath = path.posix.resolve.apply(this, arguments);
    debug('Absolute path for pathSegments: ' + arguments + ' = ' + absolutePath);
    return absolutePath;
}
exports.resolve = resolve;
function which(tool, check) {
    var response = mock.getResponse('which', tool);
    if (check) {
        checkPath(response, tool);
    }
    return response;
}
exports.which = which;
function ls(options, paths) {
    var response = mock.getResponse('ls', paths[0]);
    if (!response) {
        return [];
    }
    return response;
}
exports.ls = ls;
function cp(options, source, dest) {
    console.log('###copying###');
    debug('copying ' + source + ' to ' + dest);
}
exports.cp = cp;
function find(findPath) {
    return mock.getResponse('find', findPath);
}
exports.find = find;
function rmRF(path) {
    var response = mock.getResponse('rmRF', path);
    if (!response['success']) {
        setResult(1, response['message']);
    }
}
exports.rmRF = rmRF;
function mv(source, dest, force, continueOnError) {
    debug('moving ' + source + ' to ' + dest);
    return true;
}
exports.mv = mv;
function glob(pattern) {
    debug('glob ' + pattern);
    var matches = mock.getResponse('glob', pattern);
    debug('found ' + matches.length + ' matches');
    if (matches.length > 0) {
        var m = Math.min(matches.length, 10);
        debug('matches:');
        if (m == 10) {
            debug('listing first 10 matches as samples');
        }
        for (var i = 0; i < m; i++) {
            debug(matches[i]);
        }
    }
    return matches;
}
exports.glob = glob;
function globFirst(pattern) {
    debug('globFirst ' + pattern);
    var matches = glob(pattern);
    if (matches.length > 1) {
        warning('multiple workspace matches.  using first.');
    }
    debug('found ' + matches.length + ' matches');
    return matches[0];
}
exports.globFirst = globFirst;
//-----------------------------------------------------
// Exec convenience wrapper
//-----------------------------------------------------
function exec(tool, args, options) {
    var toolPath = which(tool, true);
    var tr = createToolRunner(toolPath);
    if (args) {
        tr.arg(args);
    }
    return tr.exec(options);
}
exports.exec = exec;
function execSync(tool, args, options) {
    var toolPath = which(tool, true);
    var tr = createToolRunner(toolPath);
    if (args) {
        tr.arg(args);
    }
    return tr.execSync(options);
}
exports.execSync = execSync;
function createToolRunner(tool) {
    var tr = new trm.ToolRunner(tool);
    tr.on('debug', (message) => {
        debug(message);
    });
    return tr;
}
exports.createToolRunner = createToolRunner;
function tool(tool) {
    return createToolRunner(tool);
}
exports.tool = tool;
//-----------------------------------------------------
// Matching helpers
//-----------------------------------------------------
function match(list, pattern, options) {
    return mock.getResponse('match', pattern) || [];
}
exports.match = match;
function matchFile(list, pattern, options) {
    return mock.getResponse('match', pattern) || [];
}
exports.matchFile = matchFile;
function filter(pattern, options) {
    return mock.getResponse('filter', pattern) || [];
}
exports.filter = filter;
//-----------------------------------------------------
// Test Publisher
//-----------------------------------------------------
class TestPublisher {
    constructor(testRunner) {
        this.testRunner = testRunner;
    }
    publish(resultFiles, mergeResults, platform, config, runTitle, publishRunAttachments) {
        var properties = {};
        properties['type'] = this.testRunner;
        if (mergeResults) {
            properties['mergeResults'] = mergeResults;
        }
        if (platform) {
            properties['platform'] = platform;
        }
        if (config) {
            properties['config'] = config;
        }
        if (runTitle) {
            properties['runTitle'] = runTitle;
        }
        if (publishRunAttachments) {
            properties['publishRunAttachments'] = publishRunAttachments;
        }
        if (resultFiles) {
            properties['resultFiles'] = resultFiles;
        }
        command('results.publish', properties, '');
    }
}
exports.TestPublisher = TestPublisher;
//-----------------------------------------------------
// Code Coverage Publisher
//-----------------------------------------------------
class CodeCoveragePublisher {
    constructor() {
    }
    publish(codeCoverageTool, summaryFileLocation, reportDirectory, additionalCodeCoverageFiles) {
        var properties = {};
        if (codeCoverageTool) {
            properties['codecoveragetool'] = codeCoverageTool;
        }
        if (summaryFileLocation) {
            properties['summaryfile'] = summaryFileLocation;
        }
        if (reportDirectory) {
            properties['reportdirectory'] = reportDirectory;
        }
        if (additionalCodeCoverageFiles) {
            properties['additionalcodecoveragefiles'] = additionalCodeCoverageFiles;
        }
        command('codecoverage.publish', properties, "");
    }
}
exports.CodeCoveragePublisher = CodeCoveragePublisher;
//-----------------------------------------------------
// Code coverage Publisher
//-----------------------------------------------------
class CodeCoverageEnabler {
    constructor(buildTool, ccTool) {
        this.buildTool = buildTool;
        this.ccTool = ccTool;
    }
    enableCodeCoverage(buildProps) {
        buildProps['buildtool'] = this.buildTool;
        buildProps['codecoveragetool'] = this.ccTool;
        command('codecoverage.enable', buildProps, "");
    }
}
exports.CodeCoverageEnabler = CodeCoverageEnabler;
//-----------------------------------------------------
// Tools
//-----------------------------------------------------
exports.TaskCommand = tcm.TaskCommand;
exports.commandFromString = tcm.commandFromString;
exports.ToolRunner = trm.ToolRunner;
trm.debug = debug;
