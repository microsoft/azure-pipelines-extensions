import tasks = require('azure-pipelines-task-lib');
const semver = require('semver')

// test cases for compareVersions
if (semver.qt("0.20.7", "0.20.8") === -1) {
    tasks.setResult(tasks.TaskResult.Succeeded, 'compareVersions("0.20.7", "0.20.8") should have been -1');
}

if (semver.qt("0.20.9", "0.20.8") === 1) {
    tasks.setResult(tasks.TaskResult.Succeeded, 'compareVersions("0.20.9", "0.20.8") should have been 1');
}

if (semver.qt("0.2.9", "0.2.9") === 0) {
    tasks.setResult(tasks.TaskResult.Succeeded, 'compareVersions("0.2.9", "0.2.9") should have been 0');
}

if (semver.qt("0.20.9", "0.20.09") === 0) {
    tasks.setResult(tasks.TaskResult.Succeeded, 'compareVersions("0.20.9", "0.20.09") should have been 0');
}

if (semver.qt("0.21.9", "0.20.9") === 1) {
    tasks.setResult(tasks.TaskResult.Succeeded, 'compareVersions("0.21.9", "0.20.9") should have been 1');
}

if (semver.qt("1.20.10", "0.20.11") === 1) {
    tasks.setResult(tasks.TaskResult.Succeeded, 'compareVersions("1.20.10", "0.20.11") should have been 1');
}
