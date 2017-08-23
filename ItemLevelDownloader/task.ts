import * as path from 'path'

import * as models from "./Models"
import * as engine from "./Engine"
import * as providers from "./Providers"

var config = require("./config.json")

async function main(): Promise<void> {
    let downloader = new engine.FetchEngine();

    let downloaderOptions = new engine.FetchEngineOptions();
    downloaderOptions.downloadFileTimeoutInMinutes = 5;
    downloaderOptions.itemPattern = "**";
    downloaderOptions.parallelDownloadLimit = 4;
    downloaderOptions.retryIntervalInSeconds = 3;
    downloaderOptions.retryLimit = 2;

    await downloadVSTSDropWithMultipleFiles(downloaderOptions);
    await downloadTeamCityDropWithMultipleFiles(downloaderOptions);
    await downloadJenkinsDropWithMultipleFiles(downloaderOptions);

    // Enable these to test big drops if required.
    //await downloadBigTeamCityDrop(downloaderOptions);
}

async function downloadVSTSDropWithMultipleFiles(downloaderOptions) {
    let downloader = new engine.FetchEngine();

    var itemsUrl = "https://panditaomesh.visualstudio.com/_apis/resources/Containers/573756?itemPath=sources&isShallow=true"
    var vstsVariables = {};
    var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", "", config.vsts.pat, vstsVariables);
    var dropLocation = path.join(config.dropLocation, "vstsDropWithMultipleFiles");
    await downloader.fetchItems(webProvider, dropLocation, downloaderOptions);
}

async function downloadJenkinsDropWithMultipleFiles(downloaderOptions) {
    let downloader = new engine.FetchEngine();

    var itemsUrl = "http://redvstt-lab43:8080/job/ArtifactJob/5/api/json?tree=artifacts[*]"
    var variables = {
        "endpoint": {
            "url": "http://redvstt-lab43:8080"
        },
        "definition": "ArtifactJob",
        "version": "5"
    };

    var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", config.jenkins.username, config.jenkins.password, variables);
    var dropLocation = path.join(config.dropLocation, "jenkinsDropWithMultipleFiles");

    await downloader.fetchItems(webProvider, dropLocation, downloaderOptions);
}

async function downloadTeamCityDropWithMultipleFiles(downloaderOptions) {
    let downloader = new engine.FetchEngine();

    var itemsUrl = "https://teamcity.jetbrains.com/httpAuth/app/rest/builds/id:1111970/artifacts/children/"
    var teamcityVariables = {
        "endpoint": {
            "url": "https://teamcity.jetbrains.com"
        }
    };
    var webProvider = new providers.WebProvider(itemsUrl, "teamcity.handlebars", config.teamcity.username, config.teamcity.password, teamcityVariables);
    var dropLocation = path.join(config.dropLocation, "teamCityDropWithMultipleFiles");

    await downloader.fetchItems(webProvider, dropLocation, downloaderOptions);
}

async function downloadBigTeamCityDrop(downloaderOptions) {
    let downloader = new engine.FetchEngine();

    var itemsUrl = "https://teamcity.jetbrains.com/httpAuth/app/rest/builds/id:1148795/artifacts/children/"
    var teamcityVariables = {
        "endpoint": {
            "url": "https://teamcity.jetbrains.com"
        }
    };
    var webProvider = new providers.WebProvider(itemsUrl, "teamcity.handlebars", config.teamcity.username, config.teamcity.password, teamcityVariables);
    var dropLocation = path.join(config.dropLocation, "bigTeamCityDrop");

    await downloader.fetchItems(webProvider, dropLocation, downloaderOptions);
}

main();
