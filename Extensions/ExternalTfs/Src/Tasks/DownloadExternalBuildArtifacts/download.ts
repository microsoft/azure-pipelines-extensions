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

        var templatePath = path.join(__dirname, 'vsts.handlebars');
        var buildApi = vssConnection.getBuildApi();
        
        var artifacts = await buildApi.getArtifacts(parseInt(buildId), projectId).catch((reason) => {
            reject(reason);
        });

        console.log("Linked artifacts count: " + artifacts.length);

        artifacts.forEach(async function (artifact, index, artifacts) {
            if (artifact.resource.type.toLowerCase() === "container") {
                let downloader = new engine.ArtifactEngine();
                var downloaderOptions = new engine.ArtifactEngineOptions();
                downloaderOptions.itemPattern = itemPattern;
                downloaderOptions.parallelProcessingLimit = +tl.getVariable("release.artifact.download.parallellimit") || 4;
                
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

                await downloader.processItems(webProvider, fileSystemProvider, downloaderOptions).catch((reason) => {
                    reject(reason);
                });
            }
            else if (artifact.resource.type.toLowerCase() === "filepath") {
                let downloader = new engine.ArtifactEngine();
                var downloaderOptions = new engine.ArtifactEngineOptions();
                downloaderOptions.itemPattern = itemPattern;
                downloaderOptions.parallelProcessingLimit = +tl.getVariable("release.artifact.download.parallellimit") || 4;

                console.log(tl.loc("DownloadArtifacts", artifact.resource.downloadUrl));
                var fileShareProvider = new providers.FilesystemProvider(artifact.resource.downloadUrl.replace("file:", ""));
                var fileSystemProvider = new providers.FilesystemProvider(downloadPath);
                
                await downloader.processItems(fileShareProvider, fileSystemProvider, downloaderOptions).catch((reason) => {
                    reject(reason);
                });
            }
            else {
                console.log("Unsupported artifact type: " + artifact.resource.type);
            }

            if(index == artifacts.length - 1){
                resolve();
            }
        });
   });

   return promise;
}

main()
    .then((result) => tl.setResult(tl.TaskResult.Succeeded, ""))
    .catch((error) => tl.setResult(tl.TaskResult.Failed, error));