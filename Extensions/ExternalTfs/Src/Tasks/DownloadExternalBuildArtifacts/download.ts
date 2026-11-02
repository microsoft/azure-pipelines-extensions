import * as fs from 'fs';
import * as path from 'path';

import * as engine from "artifact-engine/Engine";
import * as providers from "artifact-engine/Providers";
import { WebApi, getBasicHandler } from 'azure-devops-node-api/WebApi';
import * as tl from 'azure-pipelines-task-lib/task';
import * as webHandlers from "typed-rest-client/Handlers";

import * as auth from './auth';

tl.setResourcePath(path.join(__dirname, 'task.json'));

const taskJson: { version: Record<string, number> } = JSON.parse(fs.readFileSync(path.join(__dirname, 'task.json'), 'utf8'));

export interface ConnectionDetails {
    serviceConnection: string;
    projectId: string;
    buildId: number;
    accessToken: string;
    username: string;
}

const area = 'DownloadExternalBuildArtifacts';

function getDefaultProps() {
    const hostType = (tl.getVariable('SYSTEM.HOSTTYPE') || "").toLowerCase();

    return {
        hostType: hostType,
        definitionName: '[NonEmail:' + (hostType === 'release' ? tl.getVariable('RELEASE.DEFINITIONNAME') : tl.getVariable('BUILD.DEFINITIONNAME')) + ']',
        processId: hostType === 'release' ? tl.getVariable('RELEASE.RELEASEID') : tl.getVariable('BUILD.BUILDID'),
        processUrl: hostType === 'release' ? tl.getVariable('RELEASE.RELEASEWEBURL') : (`${tl.getVariable('SYSTEM.TEAMFOUNDATIONSERVERURI')}${tl.getVariable('SYSTEM.TEAMPROJECT')}/_build?buildId=${tl.getVariable('BUILD.BUILDID')}`),
        taskDisplayName: tl.getVariable('TASK.DISPLAYNAME'),
        jobid: tl.getVariable('SYSTEM.JOBID'),
        agentVersion: tl.getVariable('AGENT.VERSION'),
        agentOS: tl.getVariable('AGENT.OS'),
        agentName: tl.getVariable('AGENT.NAME'),
        version: taskJson.version
    };
}

function publishEvent(feature: "reliability", properties: { issueType: string; errorMessage: string }): void {
    try {
        const splitVersion = (process.env.AGENT_VERSION || '').split('.');
        const major = parseInt(splitVersion[0] || '0');
        const minor = parseInt(splitVersion[1] || '0');
        let telemetry = '';

        if (major > 2 || (major == 2 && minor >= 120)) {
            telemetry = `##vso[telemetry.publish area=${area};feature=${feature}]${JSON.stringify(Object.assign(getDefaultProps(), properties))}`;
        } else {
            if (feature === 'reliability') {
                telemetry = "##vso[task.logissue type=error;code=" + properties.issueType + ";agentVersion=" + tl.getVariable('Agent.Version') + ";taskId=" + area + "-" + JSON.stringify(taskJson.version) + ";]" + properties.errorMessage
            }
        }

        console.log(telemetry);
    } catch (err) {
        tl.warning("Failed to log telemetry, error: " + err);
    }
}

async function main(): Promise<void> {
        const connectionType = tl.getInputRequired('connectionType');
        const itemPattern = tl.getInput('itemPattern', false);
        const downloadPath = tl.getInputRequired('downloadPath');
        const connectionDetails: ConnectionDetails = connectionType === 'ado'
            ? await configureForAdoSc()
            : configureForTfsSc();
        const endpointUrl = tl.getEndpointUrl(connectionDetails.serviceConnection, false);
        if (!endpointUrl) {
            throw new Error("Endpoint URL is not provided.");
        }

        const credentialHandler = getBasicHandler(connectionDetails.username, connectionDetails.accessToken);
        const vssConnection = new WebApi(endpointUrl, credentialHandler);
        const debugMode = tl.getVariable('System.Debug');
        const verbose = debugMode ? debugMode.toLowerCase() != 'false' : false;
        const parallelLimitVariable = tl.getVariable ? tl.getVariable("release.artifact.download.parallellimit") : undefined;
        const parallelLimit: number = +(parallelLimitVariable || "0");

        const templatePath = path.join(__dirname, 'vsts.handlebars');
        const buildApi = await vssConnection.getBuildApi();

        const maxRetries = 3;
        const artifacts = await executeWithRetries(
            "getArtifacts",
            () => buildApi.getArtifacts(connectionDetails.projectId, connectionDetails.buildId),
            maxRetries);

        if (artifacts) {
            const downloadPromises: Array<Promise<unknown>> = [];
            console.log("Linked artifacts count: " + artifacts.length);
            for (const artifact of artifacts) {
                const resource = artifact.resource;
                if (!resource || !resource.type) {
                    throw new Error(tl.loc("FileContainerInvalidArtifactData"));
                }
                const downloaderOptions = new engine.ArtifactEngineOptions();
                downloaderOptions.itemPattern = itemPattern || "";
                downloaderOptions.verbose = verbose;

                if (parallelLimit) {
                    downloaderOptions.parallelProcessingLimit = parallelLimit;
                }

                if (resource.type.toLowerCase() === "container") {
                    if (typeof resource.data !== 'string') {
                        throw new Error(tl.loc("FileContainerInvalidArtifactData"));
                    }
                    const downloader = new engine.ArtifactEngine();
                    const containerParts: string[] = resource.data.split('/', 3);
                    if (containerParts.length !== 3) {
                        throw new Error(tl.loc("FileContainerInvalidArtifactData"));
                    }

                    const containerId: number = parseInt(containerParts[1]);
                    const containerPath: string = containerParts[2];

                    let itemsUrl = endpointUrl + "/_apis/resources/Containers/" + containerId + "?itemPath=" + encodeURIComponent(containerPath) + "&isShallow=true";
                    itemsUrl = itemsUrl.replace(/([^:]\/)\/+/g, "$1");
                    console.log(tl.loc("DownloadArtifacts", itemsUrl));

                    const variables = {};

                    const handler = connectionDetails.username
                        ? new webHandlers.BasicCredentialHandler(connectionDetails.username, connectionDetails.accessToken)
                        : new webHandlers.PersonalAccessTokenCredentialHandler(connectionDetails.accessToken);

                    const webProvider = new providers.WebProvider(itemsUrl, templatePath, variables, handler);
                    const fileSystemProvider = new providers.FilesystemProvider(downloadPath);

                    downloadPromises.push(downloader.processItems(webProvider, fileSystemProvider, downloaderOptions));
                } else if (resource.type.toLowerCase() === "filepath") {
                    if (typeof resource.data !== 'string') {
                        throw new Error(tl.loc("FileContainerInvalidArtifactData"));
                    }
                    const downloader = new engine.ArtifactEngine();
                    const downloadUrl = resource.data;
                    let artifactLocation = downloadUrl + '/' + artifact.name;
                    if (!fs.existsSync(artifactLocation)) {
                        console.log(tl.loc("ArtifactNameDirectoryNotFound", artifactLocation, downloadUrl));
                        artifactLocation = downloadUrl;
                    }

                    console.log(tl.loc("DownloadArtifacts", artifactLocation));
                    const fileShareProvider = new providers.FilesystemProvider(artifactLocation);
                    const fileSystemProvider = new providers.FilesystemProvider(downloadPath + '\\' + artifact.name);

                    downloadPromises.push(downloader.processItems(fileShareProvider, fileSystemProvider, downloaderOptions));
                } else {
                    console.log(tl.loc('UnsupportedArtifactType', resource.type));
                }
            }

            await Promise.all(downloadPromises);
            console.log(tl.loc('ArtifactsSuccessfullyDownloaded', downloadPath));
        }
}

async function configureForAdoSc(): Promise<ConnectionDetails> {
    const serviceConnection = tl.getInput('azureDevOpsServiceConnection', true);
    const projectId = tl.getInput('projectAdo', true);
    const buildId = tl.getInput('versionAdo', true);
    const inputs = validateInputs(serviceConnection, projectId, buildId);

    const accessToken: string = (await auth.getAccessTokenViaWorkloadIdentityFederation(inputs.serviceConnection)) || '';

    try {
        tl.setSecret(accessToken);
    } catch {
        tl.warning('Failed to mask access token for log redaction.');
    }

    return {
        serviceConnection: inputs.serviceConnection,
        projectId: inputs.projectId,
        buildId: parseInt(inputs.buildId),
        accessToken,
        username: ''
    };
}

function configureForTfsSc(): ConnectionDetails {
    const serviceConnection = tl.getInput("connection", true);
    const projectId = tl.getInput('project', true);
    const buildId = tl.getInput('version', true);
    const inputs = validateInputs(serviceConnection, projectId, buildId);

    const username = tl.getEndpointAuthorizationParameter(inputs.serviceConnection, 'username', true) || '';
    const accessToken =
        tl.getEndpointAuthorizationParameter(inputs.serviceConnection, 'apitoken', true) ||
        tl.getEndpointAuthorizationParameter(inputs.serviceConnection, 'password', true) || '';

    try {
        tl.setSecret(accessToken);
    } catch {
        tl.warning('Failed to mask access token for log redaction.');
    }

    return {
        serviceConnection: inputs.serviceConnection,
        projectId: inputs.projectId,
        buildId: parseInt(inputs.buildId),
        accessToken,
        username
    };
}

function validateInputs(serviceConnection: string | undefined, projectId: string | undefined, buildId: string | undefined): { serviceConnection: string; projectId: string; buildId: string } {
    if (!serviceConnection || serviceConnection.trim().length === 0) {
        throw new Error("Service connection is not provided.");
    }

    if (!projectId) {
        throw new Error("Project is not provided.");
    }

    if (!buildId) {
        throw new Error("Build is not provided.");
    }

    return {
        serviceConnection,
        projectId,
        buildId
    };
}

async function executeWithRetries<T>(operationName: string, operation: () => Promise<T>, retryCount: number): Promise<T> {
    return new Promise((resolve, reject) => {
        executeWithRetriesImplementation(operationName, operation, retryCount, resolve, reject);
    });
}

function executeWithRetriesImplementation<T>(
    operationName: string,
    operation: () => Promise<T>,
    currentRetryCount: number,
    resolve: (value: T) => void,
    reject: (reason?: unknown) => void
) {
    operation().then((result) => {
        resolve(result);
    }).catch((error) => {
        if (currentRetryCount <= 0) {
            tl.error(tl.loc("OperationFailed", operationName, error));
            console.log(error);
            tl.debug(error);
            reject(error);
        } else {
            console.log(tl.loc('RetryingOperation', operationName, currentRetryCount));
            console.log(error);
            tl.debug(error);
            currentRetryCount = currentRetryCount - 1;
            setTimeout(() => executeWithRetriesImplementation(operationName, operation, currentRetryCount, resolve, reject), 4 * 1000);
        }
    });
}

main()
    .then(() => tl.setResult(tl.TaskResult.Succeeded, ""))
    .catch((err) => {
        publishEvent('reliability', { issueType: 'error', errorMessage: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
        tl.setResult(tl.TaskResult.Failed, err)
    });