import * as models from "./Models"
import * as engine from "./Engine"
import * as providers from "./Providers"

async function main(): Promise<void> {
    let downloader = new engine.FetchEngine();
    
    //await downloader.fetchItems(new providers.StubProvider(), "c:\\drop", new engine.FetchEngineOptions());

    var itemsUrl = "http://redvstt-lab43:8080/job/ArtifactJob/5/api/json?tree=artifacts[*]"
    await downloader.fetchItems(new providers.WebProvider(itemsUrl), "c:\\drop", new engine.FetchEngineOptions());
}

main();