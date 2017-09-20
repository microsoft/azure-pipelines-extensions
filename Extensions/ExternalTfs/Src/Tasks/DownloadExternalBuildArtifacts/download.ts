var path = require('path')
var url = require('url')

import * as tl from 'vsts-task-lib/task';
import { WebApi, getBasicHandler } from 'vso-node-api/WebApi';

import * as models from "item-level-downloader/Models"
import * as engine from "item-level-downloader/Engine"
import * as providers from "item-level-downloader/Providers"
import * as webHandlers from "item-level-downloader/Providers/Handlers"

tl.setResourcePath(path.join(__dirname, 'task.json'));

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
        var parallelLimit : number = +tl.getVariable("release.artifact.download.parallellimit");

        var templatePath = path.join(__dirname, 'vsts.handlebars');
        var buildApi = vssConnection.getBuildApi();

        var artifacts = await buildApi.getArtifacts(parseInt(buildId), projectId).catch((reason) => {
            reject(reason);
        });

        console.log("Linked artifacts count: " + artifacts.length);

        var downloadPromises: Array<Promise<any>> = [];

        artifacts.forEach(async function (artifact, index, artifacts) {
            let downloaderOptions = new engine.ArtifactEngineOptions();
            downloaderOptions.itemPattern = itemPattern;
            downloaderOptions.verbose = verbose;

            if(parallelLimit){
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

                var itemsUrl = endpointUrl + "/_apis/resources/Containers/" + containerId + "?itemPath=" + containerPath + "&isShallow=true";
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
                console.log(tl.loc("DownloadArtifacts", artifact.resource.downloadUrl));
                var fileShareProvider = new providers.FilesystemProvider(artifact.resource.downloadUrl.replace("file:", ""));
                var fileSystemProvider = new providers.FilesystemProvider(downloadPath);

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
    });

    return promise;
}

main()
    .then((result) => tl.setResult(tl.TaskResult.Succeeded, ""))
    .catch((error) => tl.setResult(tl.TaskResult.Failed, error));