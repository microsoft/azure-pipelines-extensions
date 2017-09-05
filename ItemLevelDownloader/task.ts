import * as path from 'path'

import * as models from "./Models"
import * as engine from "./Engine"
import * as providers from "./Providers"
import { BasicCredentialHandler } from "./Providers/handlers/basiccreds";
import { PersonalAccessTokenCredentialHandler } from "./Providers/handlers/personalaccesstoken";

var config = require("./config.json")

async function main(): Promise<void> {
    let processorOptions = new engine.ArtifactEngineOptions();
    processorOptions.fileProcessingTimeoutInMinutes = 5;
    processorOptions.itemPattern = "**";
    processorOptions.parallelProcessingLimit = 4;
    processorOptions.retryIntervalInSeconds = 3;
    processorOptions.retryLimit = 2;

    await downloadFileShareDrop(processorOptions);
    await downloadVSTSDropWithMultipleFiles(processorOptions);
    await downloadTeamCityDropWithMultipleFiles(processorOptions);
    await downloadJenkinsDropWithMultipleFiles(processorOptions);
    await uploadToAzureBlobs(processorOptions);

    // Enable these to test big drops if required.
    // await downloadBigTeamCityDrop(processorOptions);
}

async function downloadFileShareDrop(processorOptions) {
    var fileShareProvider = new providers.FilesystemProvider("//devomp/dropz");
    var fileSystemProvider = new providers.FilesystemProvider("c:\\drop");
    
    let processor = new engine.ArtifactEngine();
    
    await processor.processItems(fileShareProvider, fileSystemProvider, processorOptions);
}

async function downloadVSTSDropWithMultipleFiles(processorOptions) {
    if (!config.vsts) {
        console.warn("Skipping downloadVSTSDropWithMultipleFiles");
        return;
    }

    let processor = new engine.ArtifactEngine();

    var itemsUrl = "https://panditaomesh.visualstudio.com/_apis/resources/Containers/573756?itemPath=sources&isShallow=true"
    var vstsVariables = {};
    
    var handler = new PersonalAccessTokenCredentialHandler(config.vsts.pat);
    var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", vstsVariables, handler);
    var dropLocation = path.join(config.dropLocation, "vstsDropWithMultipleFiles");
    var localFileProvider = new providers.FilesystemProvider(dropLocation);

    await processor.processItems(webProvider, localFileProvider, processorOptions);
}

async function downloadJenkinsDropWithMultipleFiles(processorOptions) {
    let processor = new engine.ArtifactEngine();

    var itemsUrl = "http://redvstt-lab43:8080/job/ArtifactJob/5/api/json?tree=artifacts[*]"
    var variables = {
        "endpoint": {
            "url": "http://redvstt-lab43:8080"
        },
        "definition": "ArtifactJob",
        "version": "5"
    };

    var handler = new BasicCredentialHandler(config.jenkins.username, config.jenkins.password);
    var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", variables, handler, { ignoreSslError: false });
    var dropLocation = path.join(config.dropLocation, "jenkinsDropWithMultipleFiles");
    var localFileProvider = new providers.FilesystemProvider(dropLocation);

    await processor.processItems(webProvider, localFileProvider, processorOptions);
}

async function downloadTeamCityDropWithMultipleFiles(processorOptions) {
    let processor = new engine.ArtifactEngine();

    var itemsUrl = "https://teamcity.jetbrains.com/httpAuth/app/rest/builds/id:1111970/artifacts/children/"
    var teamcityVariables = {
        "endpoint": {
            "url": "https://teamcity.jetbrains.com"
        }
    };

    var handler = new BasicCredentialHandler(config.teamcity.username, config.teamcity.password);
    var webProvider = new providers.WebProvider(itemsUrl, "teamcity.handlebars", teamcityVariables, handler);
    var dropLocation = path.join(config.dropLocation, "teamCityDropWithMultipleFiles");
    var localFileProvider = new providers.FilesystemProvider(dropLocation);

    await processor.processItems(webProvider, localFileProvider, processorOptions);
}

async function downloadBigTeamCityDrop(processorOptions) {
    let processor = new engine.ArtifactEngine();

    var itemsUrl = "https://teamcity.jetbrains.com/httpAuth/app/rest/builds/id:1148795/artifacts/children/"
    var teamcityVariables = {
        "endpoint": {
            "url": "https://teamcity.jetbrains.com"
        }
    };

    var handler = new BasicCredentialHandler(config.teamcity.username, config.teamcity.password);
    var webProvider = new providers.WebProvider(itemsUrl, "teamcity.handlebars", teamcityVariables, handler);
    var dropLocation = path.join(config.dropLocation, "bigTeamCityDrop");
    var localFileProvider = new providers.FilesystemProvider(dropLocation);

    await processor.processItems(webProvider, localFileProvider, processorOptions);
}

async function uploadToAzureBlobs(processorOptions) {
    let processor = new engine.ArtifactEngine();

    var blobProvider = new providers.AzureBlobProvider(config.azureblobstorage.storageaccount, config.azureblobstorage.container, config.azureblobstorage.storagekey, "prefix");
    var localFileProvider = new providers.FilesystemProvider(config.dropLocation);

    await processor.processItems(localFileProvider, blobProvider, processorOptions);
}

main();
