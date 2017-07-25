import * as models from "./Models"
import * as engine from "./Engine"
import * as providers from "./Providers"

async function main(): Promise<void> {
    let downloader = new engine.FetchEngine();

    let downloaderOptions = new engine.FetchEngineOptions();
    downloaderOptions.downloadFileTimeoutInMinutes = 5;
    downloaderOptions.downloadPattern = "**";
    downloaderOptions.parallelDownloadLimit = 4;
    downloaderOptions.retryIntervalInSeconds = 3;
    downloaderOptions.retryLimit = 2;

    var itemsUrl = "http://redvstt-lab43:8080/job/ArtifactJob/5/api/json?tree=artifacts[*]"
    var variables = {
        "endpoint": {
            "url": "http://redvstt-lab43:8080"
        },
        "definition": "ArtifactJob",
        "version": "5"
    };
    
    var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", "", "", variables);


    itemsUrl = "https://panditaomesh.visualstudio.com/_apis/resources/Containers/573756?itemPath=sources&isShallow=true"
    var vstsVariables = {};
    var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", "", "", vstsVariables);
    
    itemsUrl = "https://teamcity.jetbrains.com/httpAuth/app/rest/builds/id:1111970/artifacts/children/"
    var teamcityVariables = {
        "endpoint": {
            "url": "https://teamcity.jetbrains.com"
        },
        "version": "12345"
    };
    var webProvider = new providers.WebProvider(itemsUrl, "teamcity.handlebars", "", "", teamcityVariables);

    await downloader.fetchItems(webProvider, "c:\\drop1", downloaderOptions);
}

main();
