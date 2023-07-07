var path = require('path')
var url = require('url')
var fs = require('fs')

import * as tl from 'vsts-task-lib/task';
import { WebApi, getBasicHandler } from 'azure-devops-node-api/WebApi';

import * as models from "artifact-engine/Models"
import * as engine from "artifact-engine/Engine"
import * as providers from "artifact-engine/Providers"
import * as webHandlers from "artifact-engine/Providers/typed-rest-client/Handlers"

tl.setResourcePath(path.join(__dirname, 'task.json'));

var taskJson = require('./task.json');
const area: string = 'DownloadExternalBuildArtifacts';

function getDefaultProps() {
    var hostType = (tl.getVariable('SYSTEM.HOSTTYPE') || "").toLowerCase();
    return {
        hostType: hostType,
        definitionName: '[NonEmail:' + (hostType === 'release' ? tl.getVariable('RELEASE.DEFINITIONNAME') : tl.getVariable('BUILD.DEFINITIONNAME')) + ']',
        processId: hostType === 'release' ? tl.getVariable('RELEASE.RELEASEID') : tl.getVariable('BUILD.BUILDID'),
        processUrl: hostType === 'release' ? tl.getVariable('RELEASE.RELEASEWEBURL') : (tl.getVariable('SYSTEM.TEAMFOUNDATIONSERVERURI') + tl.getVariable('SYSTEM.TEAMPROJECT') + '/_build?buildId=' + tl.getVariable('BUILD.BUILDID')),
        taskDisplayName: tl.getVariable('TASK.DISPLAYNAME'),
        jobid: tl.getVariable('SYSTEM.JOBID'),
        agentVersion: tl.getVariable('AGENT.VERSION'),
        agentOS: tl.getVariable('AGENT.OS'),
        agentName: tl.getVariable('AGENT.NAME'),
        version: taskJson.version
    };
}

function publishEvent(feature, properties: any): void {
    try {
        var splitVersion = (process.env.AGENT_VERSION || '').split('.');
        var major = parseInt(splitVersion[0] || '0');
        var minor = parseInt(splitVersion[1] || '0');
        let telemetry = '';
        if (major > 2 || (major == 2 && minor >= 120)) {
            telemetry = `##vso[telemetry.publish area=${area};feature=${feature}]${JSON.stringify(Object.assign(getDefaultProps(), properties))}`;
        }
        else {
            if (feature === 'reliability') {
                let reliabilityData = properties;
                telemetry = "##vso[task.logissue type=error;code=" + reliabilityData.issueType + ";agentVersion=" + tl.getVariable('Agent.Version') + ";taskId=" + area + "-" + JSON.stringify(taskJson.version) + ";]" + reliabilityData.errorMessage
            }
        }
        console.log(telemetry);;
    }
    catch (err) {
        tl.warning("Failed to log telemetry, error: " + err);
    }
}

async function main(): Promise<void> {
    var promise = new Promise<void>(async (resolve, reject) => {
        var connection = tl.getInput("connection", true);
        var projectId = tl.getInput("project", true);
        var definitionId = tl.getInput("definition", true);
        var buildId = tl.getInput("version", true);
        var itemPattern = tl.getInput("itemPattern", true);
        var downloadPath = tl.getInput("downloadPath", true);

        var endpointUrl = tl.getEndpointUrl(connection, false);
        var username = tl.getEndpointAuthorizationParameter(connection, 'username', true);
        var accessToken = tl.getEndpointAuthorizationParameter(connection, 'apitoken', true)
            || tl.getEndpointAuthorizationParameter(connection, 'password', true);
        var credentialHandler = getBasicHandler(username, accessToken);
        var vssConnection = new WebApi(endpointUrl, credentialHandler);
        var debugMode = tl.getVariable('System.Debug');
        var verbose = debugMode ? debugMode.toLowerCase() != 'false' : false;
        var parallelLimit: number = +tl.getVariable("release.artifact.download.parallellimit");

        var templatePath = path.join(__dirname, 'vsts.handlebars');
        var buildApi = await vssConnection.getBuildApi();

        var artifacts = await executeWithRetries("getArtifacts", () => buildApi.getArtifacts(projectId, parseInt(buildId)), 3).catch((reason) => {
            reject(reason);
        });

        if (artifacts) {
            var downloadPromises: Array<Promise<any>> = [];
            console.log("Linked artifacts count: " + artifacts.length);
            artifacts.forEach(async function (artifact, index, artifacts) {
                let downloaderOptions = new engine.ArtifactEngineOptions();
                downloaderOptions.itemPattern = itemPattern;
                downloaderOptions.verbose = verbose;

                if (parallelLimit) {
                    downloaderOptions.parallelProcessingLimit = parallelLimit;
                }

                if (artifact.resource.type.toLowerCase() === "container") {
                    let downloader = new engine.ArtifactEngine();
                    var containerParts: string[] = artifact.resource.data.split('/', 3);
                    if (containerParts.length !== 3) {
                        throw new Error(tl.loc("FileContainerInvalidArtifactData"));
                    }

                    var containerId: number = parseInt(containerParts[1]);
                    var containerPath: string = containerParts[2];

                    var itemsUrl = endpointUrl + "/_apis/resources/Containers/" + containerId + "?itemPath=" + encodeURIComponent(containerPath) + "&isShallow=true";
                    itemsUrl = itemsUrl.replace(/([^:]\/)\/+/g, "$1");
                    console.log(tl.loc("DownloadArtifacts", itemsUrl));

                    var variables = {};

                    var handler = username ? new webHandlers.BasicCredentialHandler(username, accessToken) : new webHandlers.PersonalAccessTokenCredentialHandler(accessToken);
                    var webProvider = new providers.WebProvider(itemsUrl, templatePath, variables, handler);
                    var fileSystemProvider = new providers.FilesystemProvider(downloadPath);

                    downloadPromises.push(downloader.processItems(webProvider, fileSystemProvider, downloaderOptions).catch((reason) => {
                        reject(reason);
                    }));
                }
                else if (artifact.resource.type.toLowerCase() === "filepath") {
                    let downloader = new engine.ArtifactEngine();
                    let downloadUrl = artifact.resource.data;
                    let artifactLocation = downloadUrl + '/' + artifact.name;
                    if (!fs.existsSync(artifactLocation)) {
                        console.log(tl.loc("ArtifactNameDirectoryNotFound", artifactLocation, downloadUrl));
                        artifactLocation = downloadUrl;
                    }

                    console.log(tl.loc("DownloadArtifacts", artifactLocation));
                    var fileShareProvider = new providers.FilesystemProvider(artifactLocation);
                    var fileSystemProvider = new providers.FilesystemProvider(downloadPath + '\\' + artifact.name);

                    downloadPromises.push(downloader.processItems(fileShareProvider, fileSystemProvider, downloaderOptions).catch((reason) => {
                        reject(reason);
                    }));
                }
                else {
                    console.log(tl.loc('UnsupportedArtifactType', artifact.resource.type));
                }
            });

            Promise.all(downloadPromises).then(() => {
                console.log(tl.loc('ArtifactsSuccessfullyDownloaded', downloadPath));
                resolve();
            }).catch((error) => {
                reject(error);
            });
        }
    });

    return promise;
}

function executeWithRetries(operationName: string, operation: () => Promise<any>, retryCount): Promise<any> {
    var executePromise = new Promise((resolve, reject) => {
        executeWithRetriesImplementation(operationName, operation, retryCount, resolve, reject);
    });

    return executePromise;
}

function executeWithRetriesImplementation(operationName: string, operation: () => Promise<any>, currentRetryCount, resolve, reject) {
    operation().then((result) => {
        resolve(result);
    }).catch((error) => {
        if (currentRetryCount <= 0) {
            tl.error(tl.loc("OperationFailed", operationName, error));
            console.log(error);
            tl.debug(error);
            reject(error);
        }
        else {
            console.log(tl.loc('RetryingOperation', operationName, currentRetryCount));
            console.log(error);
            tl.debug(error);
            currentRetryCount = currentRetryCount - 1;
            setTimeout(() => executeWithRetriesImplementation(operationName, operation, currentRetryCount, resolve, reject), 4 * 1000);
        }
    });
}

main()
    .then((result) => tl.setResult(tl.TaskResult.Succeeded, ""))
    .catch((err) => {
        publishEvent('reliability', { issueType: 'error', errorMessage: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
        tl.setResult(tl.TaskResult.Failed, err)
    });