const path = require('path');

import * as tl from 'azure-pipelines-task-lib/task';
import * as engine from 'artifact-engine/Engine';
import * as providers from 'artifact-engine/Providers';
import * as webHandlers from 'artifact-engine/Providers/typed-rest-client/Handlers';

tl.setResourcePath(path.join(__dirname, 'task.json'));

const taskJson = require('./task.json');
const area = 'DownloadTeamCityArtifacts';

function getDefaultProps() {
    const hostType = (tl.getVariable('SYSTEM.HOSTTYPE') || "").toLowerCase();
    return {
        hostType: hostType,
        definitionName: '[NonEmail:' + (hostType === 'release' ? tl.getVariable('RELEASE.DEFINITIONNAME') : tl.getVariable('BUILD.DEFINITIONNAME')) + ']',
        processId: hostType === 'release' ? tl.getVariable('RELEASE.RELEASEID') : tl.getVariable('BUILD.BUILDID'),
        processUrl: hostType === 'release' ? tl.getVariable('RELEASE.RELEASEWEBURL') : (tl.getVariable('SYSTEM.TEAMFOUNDATIONSERVERURI')! + tl.getVariable('SYSTEM.TEAMPROJECT') + '/_build?buildId=' + tl.getVariable('BUILD.BUILDID')),
        taskDisplayName: tl.getVariable('TASK.DISPLAYNAME'),
        jobid: tl.getVariable('SYSTEM.JOBID'),
        agentVersion: tl.getVariable('AGENT.VERSION'),
        agentOS: tl.getVariable('AGENT.OS'),
        agentName: tl.getVariable('AGENT.NAME'),
        version: taskJson.version
    };
}

function publishEvent(feature: string, properties: any): void {
    try {
        const splitVersion = (process.env.AGENT_VERSION || '').split('.');
        const major = parseInt(splitVersion[0] || '0');
        const minor = parseInt(splitVersion[1] || '0');
        let telemetry = '';

        if (major > 2 || (major == 2 && minor >= 120)) {
            telemetry = `##vso[telemetry.publish area=${area};feature=${feature}]${JSON.stringify(Object.assign(getDefaultProps(), properties))}`;
        } else {
            if (feature === 'reliability') {
                let reliabilityData = properties;
                telemetry = "##vso[task.logissue type=error;code=" + reliabilityData.issueType + ";agentVersion=" + tl.getVariable('Agent.Version') + ";taskId=" + area + "-" + JSON.stringify(taskJson.version) + ";]" + reliabilityData.errorMessage
            }
        }

        console.log(telemetry);
    }
    catch (err) {
        tl.warning("Failed to log telemetry, error: " + err);
    }
}

async function main(): Promise<void> {
    const promise = new Promise<void>(async (resolve, reject) => {
        let connection = tl.getInput("connection", true)!;
        let buildId = tl.getInput("version", true);
        let itemPattern = tl.getInput("itemPattern", false);
        let downloadPath = tl.getInput("downloadPath", true)!;

        const endpointUrl = tl.getEndpointUrl(connection, false);
        let itemsUrl = endpointUrl + "/httpAuth/app/rest/builds/id:" + buildId + "/artifacts/children/";
        itemsUrl = itemsUrl.replace(/([^:]\/)\/+/g, "$1");
        console.log(tl.loc("DownloadArtifacts", itemsUrl));

        const templatePath = path.join(__dirname, 'teamcity.handlebars');
        const username = tl.getEndpointAuthorizationParameter(connection, 'username', false)!;
        const password = tl.getEndpointAuthorizationParameter(connection, 'password', false)!;

        try {
            tl.setSecret(password);
        } catch {
            tl.warning('Failed to mask password for log redaction.');
        }

        const teamcityVariables = {
            "endpoint": {
                "url": endpointUrl
            }
        };
        const handler = new webHandlers.BasicCredentialHandler(username, password);
        const webProvider = new providers.WebProvider(itemsUrl, templatePath, teamcityVariables, handler);
        const fileSystemProvider = new providers.FilesystemProvider(downloadPath);
        const parallelLimit = Number(tl.getVariable("release.artifact.download.parallellimit"));

        const downloader = new engine.ArtifactEngine();
        const downloaderOptions = new engine.ArtifactEngineOptions();
        downloaderOptions.itemPattern = itemPattern ? itemPattern : '**';
        const debugMode = tl.getVariable('System.Debug');
        downloaderOptions.verbose = debugMode ? debugMode.toLowerCase() != 'false' : false;

        if (parallelLimit) {
            downloaderOptions.parallelProcessingLimit = parallelLimit;
        }

        await downloader.processItems(webProvider, fileSystemProvider, downloaderOptions).then(() => {
            console.log(tl.loc('ArtifactsSuccessfullyDownloaded', downloadPath));
            resolve();
        }).catch((error) => {
            reject(error);
        });
    });

    return promise;
}

main()
    .then(() => {
        tl.setResult(tl.TaskResult.Succeeded, "");
    })
    .catch((err) => {
        publishEvent('reliability', { issueType: 'error', errorMessage: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
        tl.setResult(tl.TaskResult.Failed, err);
    });