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
    let downloadPattern = tl.getInput("downloadPattern", true);
    let downloadPath = tl.getInput("downloadPath", true);
    
    var endpointUrl = tl.getEndpointUrl(connection, false);
    var itemsUrl = url.resolve(endpointUrl, "/httpAuth/app/rest/builds/id:" + buildId + "/artifacts/children/");
    console.log(tl.loc("DownloadArtifacts", itemsUrl));

    var teamcityVariables = {
        "endpoint": {
            "url": endpointUrl
        }
    };	
    var username = tl.getEndpointAuthorizationParameter(connection, 'username', false);
    var password = tl.getEndpointAuthorizationParameter(connection, 'password', false);
    var webProvider = new providers.WebProvider(itemsUrl, "teamcity.handlebars", username, password, teamcityVariables);

    let downloader = new engine.FetchEngine();
    let downloaderOptions = new engine.FetchEngineOptions();
    await downloader.fetchItems(webProvider, downloadPath, downloaderOptions);
    
    tl.setResult(tl.TaskResult.Succeeded, "");
}

main()
    .then((result) => tl.setResult(tl.TaskResult.Succeeded, ""))
    .catch((error) => tl.setResult(tl.TaskResult.Failed, error));