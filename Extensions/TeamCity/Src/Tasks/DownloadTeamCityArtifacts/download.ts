var path = require('path')
var url = require('url')

import * as tl from 'vsts-task-lib/task';
import * as models from "item-level-downloader/Models"
import * as engine from "item-level-downloader/Engine"
import * as providers from "item-level-downloader/Providers"

tl.setResourcePath(path.join(__dirname, 'task.json'));

async function main(): Promise<void> {
    let connection = tl.getInput("connection", true);
    let projectId = tl.getInput("project", true);
    let definitionId = tl.getInput("definition", true);
    let buildId = tl.getInput("version", true);
    let itemPattern = tl.getInput("itemPattern", false);
    let downloadPath = tl.getInput("downloadPath", true);
    
    var endpointUrl = tl.getEndpointUrl(connection, false);
    var itemsUrl = endpointUrl + "/httpAuth/app/rest/builds/id:" + buildId + "/artifacts/children/";
    itemsUrl = itemsUrl.replace(/([^:]\/)\/+/g, "$1");
    console.log(tl.loc("DownloadArtifacts", itemsUrl));

    var templatePath = path.join(__dirname, 'teamcity.handlebars');
    var username = tl.getEndpointAuthorizationParameter(connection, 'username', false);
    var password = tl.getEndpointAuthorizationParameter(connection, 'password', false);
    var teamcityVariables = {
        "endpoint": {
            "url": endpointUrl
        }
    };
    
    var webProvider = new providers.WebProvider(itemsUrl, templatePath, username, password, teamcityVariables);
    var fileSystemProvider = new providers.FilesystemProvider(downloadPath);

    var downloader = new engine.ArtifactEngine();
    var downloaderOptions = new engine.ArtifactEngineOptions();
    downloaderOptions.itemPattern = itemPattern ? itemPattern : '**';
    downloaderOptions.parallelProcessingLimit = +tl.getVariable("release.artifact.download.parallellimit") || 4;
    await downloader.processItems(webProvider, fileSystemProvider, downloaderOptions);
    
    tl.setResult(tl.TaskResult.Succeeded, "");
}

main()
    .then((result) => tl.setResult(tl.TaskResult.Succeeded, ""))
    .catch((error) => tl.setResult(tl.TaskResult.Failed, error));