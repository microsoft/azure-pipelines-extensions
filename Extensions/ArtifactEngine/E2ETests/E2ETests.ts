import * as assert from 'assert';
import * as path from 'path'
import * as fs from 'fs'

import * as models from "../Models"
import * as engine from "../Engine"
import * as providers from "../Providers"

import { BasicCredentialHandler } from "../Providers/handlers/basiccreds";
import { PersonalAccessTokenCredentialHandler } from "../Providers/handlers/personalaccesstoken";

var config = require("./config.json")

describe('e2e tests', () => {
    it('should be able to download jenkins artifact', function (done) {
        this.timeout(15000);
        let processor = new engine.ArtifactEngine();

        let processorOptions = new engine.ArtifactEngineOptions();
        processorOptions.fileProcessingTimeoutInMinutes = 5;
        processorOptions.itemPattern = "**";
        processorOptions.parallelProcessingLimit = 8;
        processorOptions.retryIntervalInSeconds = 1000;
        processorOptions.retryLimit = 2;
        processorOptions.verbose = true;

        var itemsUrl = "http://redvstt-lab43:8080/job/ArtifactEngineJob/6/api/json?tree=artifacts[*]"
        var variables = {
            "endpoint": {
                "url": "http://redvstt-lab43:8080"
            },
            "definition": "ArtifactEngineJob",
            "version": "6"
        };

        var handler = new BasicCredentialHandler(config.jenkins.username, config.jenkins.password);
        var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", variables, handler, { ignoreSslError: false });
        var dropLocation = path.join(config.dropLocation, "jenkinsDropWithMultipleFiles");
        var filesystemProvider = new providers.FilesystemProvider(dropLocation);

        processor.processItems(webProvider, filesystemProvider, processorOptions)
            .then((tickets) => {
                fs.readFile(path.join(config.dropLocation, 'jenkinsDropWithMultipleFiles/Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt'), 'utf8', function (err, data) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(data, "dummyFolderContent");
                    done();
                });
                
                assert.equal(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb").retryCount, 0);
                assert.equal(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt").retryCount, 0);
            }, (error) => {
                throw "test failure";
            });
    });
});

/* async function main(): Promise<void> {
    let processorOptions = new engine.ArtifactEngineOptions();
    processorOptions.fileProcessingTimeoutInMinutes = 5;
    processorOptions.itemPattern = "**";
    processorOptions.parallelProcessingLimit = 8;
    processorOptions.retryIntervalInSeconds = 3;
    processorOptions.retryLimit = 2;
    processorOptions.verbose = true;

    //await downloadTeamCityDropWithMultipleFiles2(processorOptions);

    //await downloadFileShareDrop(processorOptions);
    ///await downloadVSTSDropWithMultipleFiles(processorOptions);
    //await downloadTeamCityDropWithMultipleFiles(processorOptions);
    await downloadJenkinsDropWithMultipleFiles(processorOptions);

    //await downloadVSTSDropWithMultipleFiles2(processorOptions);

    // Enable these to test big drops if required.
    // await downloadBigTeamCityDrop(processorOptions);
} */

async function downloadTeamCityDropWithMultipleFiles2(processorOptions) {
    let processor = new engine.ArtifactEngine();

    var itemsUrl = "http://localhost:88/httpAuth/app/rest/builds/id:41/artifacts/children/"
    var teamcityVariables = {
        "endpoint": {
            "url": "http://localhost:88/"
        }
    };

    var handler = new BasicCredentialHandler("", "");
    var webProvider = new providers.WebProvider(itemsUrl, "teamcity.handlebars", teamcityVariables, handler);
    var dropLocation = path.join(config.dropLocation, "teamCityDropWithMultipleFiles");
    var localFileProvider = new providers.FilesystemProvider(dropLocation);

    await processor.processItems(webProvider, localFileProvider, processorOptions);
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

async function downloadVSTSDropWithMultipleFiles2(processorOptions) {
    if (!config.vsts) {
        console.warn("Skipping downloadVSTSDropWithMultipleFiles2");
        return;
    }

    let processor = new engine.ArtifactEngine();

    var itemsUrl = "https://rmbugbash.rminttfs.tfsallin.net/_apis/resources/Containers/719?itemPath=Drop&isShallow=true"
    var vstsVariables = {};

    var handler = new PersonalAccessTokenCredentialHandler(config.bugbash.pat);
    var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", vstsVariables, handler);
    var dropLocation = path.join(config.dropLocation, "vstsDropWithMultipleFiles2");
    var localFileProvider = new providers.FilesystemProvider(dropLocation);

    await processor.processItems(webProvider, localFileProvider, processorOptions);
}

async function downloadJenkinsDropWithMultipleFiles(processorOptions) {
    let processor = new engine.ArtifactEngine();

    var itemsUrl = "http://redvstt-lab43:8080/job/ArtifactEngineJob/6/api/json?tree=artifacts[*]"
    var variables = {
        "endpoint": {
            "url": "http://redvstt-lab43:8080"
        },
        "definition": "ArtifactEngineJob",
        "version": "6"
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
