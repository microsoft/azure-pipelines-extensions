import tasks = require('azure-pipelines-task-lib/task');
import tools = require('azure-pipelines-tool-lib/tool');
import path = require('path');
import os = require('os');
import fs = require('fs');

const uuidV4 = require('uuid/v4');
const terraformToolName = "terraform";
const isWindows = os.type().match(/^Win/);
const httpm = require("typed-rest-client/HttpClient");
let pkg = require(path.join(__dirname, 'package.json'));
let userAgent = 'vsts-task-installer/' + pkg.version;
let requestOptions = {
    // ignoreSslError: true,
    proxy: tasks.getHttpProxyConfiguration(),
    cert: tasks.getHttpCertConfiguration()
};
let http = new httpm.HttpClient(userAgent, null, requestOptions);

export async function downloadTerraform(inputVersion: string): Promise<string> {
    let version: string;
    if (inputVersion == "latest") {
        version = await getLatestTerraformVersion();
    } else {
        version = tools.cleanVersion(inputVersion);
    }
    if (!version) {
        throw new Error(tasks.loc("InputVersionNotValidSemanticVersion", inputVersion));
    }

    let cachedToolPath = tools.findLocalTool(terraformToolName, version);
    if (!cachedToolPath) {
        let terraformDownloadUrl = getTerraformDownloadUrl(version);
        let fileName = `${terraformToolName}-${version}-${uuidV4()}.zip`;
        let terraformDownloadPath;

        try {
            terraformDownloadPath = await tools.downloadTool(terraformDownloadUrl, fileName);
        } catch (exception) {
            throw new Error(tasks.loc("TerraformDownloadFailed", terraformDownloadUrl, exception));
        }

        let terraformUnzippedPath = await tools.extractZip(terraformDownloadPath);
        cachedToolPath = await tools.cacheDir(terraformUnzippedPath, terraformToolName, version);
    }

    let terraformPath = findTerraformExecutable(cachedToolPath);
    if (!terraformPath) {
        throw new Error(tasks.loc("TerraformNotFoundInFolder", cachedToolPath));
    }

    if (!isWindows) {
        fs.chmodSync(terraformPath, "777");
    }

    tasks.setVariable('terraformLocation', terraformPath);

    return terraformPath;
}

async function getLatestTerraformVersion(): Promise<string> {
    async function fetchReleases<T>(): Promise<any> {
        let terraformRelasesUrl = "https://releases.hashicorp.com/terraform/index.json"
        let response = http.get(terraformRelasesUrl);
        if (response.message.statusCode != 200) {
            let err = new Error('Unexpected HTTP response: ' + response.message.statusCode);
            err['httpStatusCode'] = response.message.statusCode;
            tasks.debug(`Failed to download "${terraformRelasesUrl}". Code(${response.message.statusCode}) Message(${response.message.statusMessage})`);
            throw err;
        }
        let releases = [];
        let json = JSON.parse(response.readBody());
        Object.keys(json.versions).forEach(key => releases.push(json.versions[key]));
    }

    let terraformReleases = await fetchReleases();
    return terraformReleases.map(v => v.version).filter(v => v.indexOf("-") < 0).sort((a, b) => {
        const ba = b.split('.');
        const d = a.split('.').map((a1, i) => a1 - ba[i]);
        return d[0] ? d[0] : d[1] ? d[1] : d[2]
    }).reverse()[0];
}

function getTerraformDownloadUrl(version: string): string {
    let platform: string;
    let architecture: string;

    switch (os.type()) {
        case "Darwin":
            platform = "darwin";
            break;

        case "Linux":
            platform = "linux";
            break;

        case "Windows_NT":
            platform = "windows";
            break;

        default:
            throw new Error(tasks.loc("OperatingSystemNotSupported", os.type()));
    }

    switch (os.arch()) {
        case "x64":
            architecture = "amd64";
            break;

        case "x32":
            architecture = "386";
            break;

        default:
            throw new Error(tasks.loc("ArchitectureNotSupported", os.arch()));
    }

    return `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_${platform}_${architecture}.zip`;
}

function findTerraformExecutable(rootFolder: string): string {
    let terraformPath = path.join(rootFolder, terraformToolName + getExecutableExtension());
    var allPaths = tasks.find(rootFolder);
    var matchingResultFiles = tasks.match(allPaths, terraformPath, rootFolder);
    return matchingResultFiles[0];
}

function getExecutableExtension(): string {
    if (isWindows) {
        return ".exe";
    }

    return "";
}