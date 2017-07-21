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
    
    var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", "admin", "jenkins123", variables);
    
    await downloader.fetchItems(webProvider, "c:\\drop1", downloaderOptions);
}

main();
