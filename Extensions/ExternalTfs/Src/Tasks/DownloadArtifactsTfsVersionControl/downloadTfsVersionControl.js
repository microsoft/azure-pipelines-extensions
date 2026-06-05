const path = require('path');
const shell = require('shelljs');

const tl = require('azure-pipelines-task-lib/task');

const tfvcwm = require('./tfvcwrapper');

const projectId = /** @type {string} */ (tl.getInput("project", true));
const repositoryId = /** @type {string} */ (tl.getInput("definition", true));
const changesetId = tl.getInput("version");
const downloadPath = /** @type {string} */ (tl.getInput("downloadPath", true));
const tfsEndpoint = getEndpointDetails("connection");

console.log("project: " + String(projectId));
console.log("definition: " + String(repositoryId));
console.log("version: " + (!!changesetId ? String(changesetId) : "Latest"));
console.log("downloadPath: " + String(downloadPath));
console.log("tfsEndpoint:" + JSON.stringify(tfsEndpoint && tfsEndpoint.Url));

/** @type {any} */
const tfvcw = new tfvcwm.TfvcWrapper();

tfvcw.on('stdout', (/** @type {any} */ data) => console.log(data.toString()));
tfvcw.on('stderr', (/** @type {any} */ data) => console.log(data.toString()));
tfvcw.on('debug', (/** @type {any} */ data) => console.log(data.toString()));
tfvcw.setTfvcConnOptions({
    username: tfsEndpoint.Username,
    password: tfsEndpoint.Password,
    collection: tfsEndpoint.Url
});

getCode();

/**
 * @param {string} inputFieldName
 */
function getEndpointDetails(inputFieldName) {
    const errorMessage = "Could not decode the External Tfs endpoint. Please ensure you are running the latest agent";
    if (!tl.getEndpointUrl) {
        throw new Error(errorMessage);
    }
    const externalTfsEndpoint = tl.getInput(inputFieldName);
    if (!externalTfsEndpoint) {
        throw new Error(errorMessage);
    }
    const hostUrl = tl.getEndpointUrl(externalTfsEndpoint, false);
    if (!hostUrl) {
        throw new Error(errorMessage);
    }
    const auth = tl.getEndpointAuthorization(externalTfsEndpoint, false);

    if (!auth) {
        throw new Error(errorMessage);
    }

    if (auth.scheme != "UsernamePassword" && auth.scheme != "Token") {
        throw new Error("The authorization scheme " + auth.scheme + " is not supported for a External Tfs endpoint.");
    }

    let hostUsername = ".";
    let hostPassword = "";

    if (auth.scheme === "Token") {
        hostPassword = getAuthParameter(auth, 'apitoken');
    } else {
        hostUsername = getAuthParameter(auth, 'username');
        hostPassword = getAuthParameter(auth, 'password');
    }

    if (hostPassword) {
        tl.setSecret(hostPassword);
    }

    return {
        "Url": hostUrl,
        "Username": hostUsername,
        "Password": hostPassword
    };
}

/**
 * @param {{ parameters: Record<string, string> }} auth
 * @param {string} paramName
 * @returns {string}
 */
function getAuthParameter(auth, paramName) {
    const parameters = Object.getOwnPropertyNames(auth['parameters']);
    let keyName;
    parameters.some(function (key) {
        if (key.toLowerCase() === paramName.toLowerCase()) {
            keyName = key;
            return true;
        }
    });

    if (!keyName) {
        return "";
    }

    return auth['parameters'][keyName];
}

function getCode() {
    const workspaceName = getWorkspaceName();
    const workspaceMappings = getDefaultTfvcMappings();

    const newWorkspace = {
        name: workspaceName,
        mappings: []
    };

    console.log("Try deleting workspace if it already exists");
    return tfvcw.deleteWorkspace(newWorkspace)
        .then(function (/** @type {number} */ retCode) {
            if (retCode === 0) {
                console.log("Successfully deleted workspace");
            }
            if (IsPathExists(downloadPath)) {
                console.log("Cleaning up artifacts download path");
                return utilExec('rm -fr ' + downloadPath)
                    .then(function (/** @type {{ code: number, output: string }} */ ret) {
                        if (ret.code === 0) {
                            console.log("Successfully cleaned up artifacts download path");
                        }
                        return ret.code;
                    });
            } else {
                return 0;
            }
        }, function (/** @type {unknown} */ error) {
            console.log("Warning: Failed to delete Workspace. Ignoring it as this could happen due to non existent workspace. " + error);
            if (IsPathExists(downloadPath)) {
                console.log("Artifacts download path exists. Cleaning up");
                return utilExec('rm -fr ' + downloadPath)
                    .then(function (/** @type {{ code: number, output: string }} */ ret) {
                        if (ret.code === 0) {
                            console.log("Successfully cleaned up artifacts download path");
                        }
                        return ret.code;
                    });
            } else {
                return 0;
            }
        })
        .then(function () {
            ensurePathExist(downloadPath);
            shell.cd(downloadPath);
            console.log("Creating new workspace: " + newWorkspace.name);
            return tfvcw.newWorkspace(newWorkspace)
                .then(function (/** @type {number} */ retCode) {
                    if (retCode === 0) {
                        console.log("Successfully created workspace");
                    }
                    return retCode;
                }, function (/** @type {unknown} */ error) {
                    tl.error("Failed to Create a new Workspace. " + error);
                    process.exit(1);
                });
        })
        .then(function () {
            // workspace must exist now
            // Sometime the job fails with:
            //   An argument error occurred: Unable to determine the workspace.
            //   You may be able to correct this by running 'tf workspaces -collection:TeamProjectCollectionUrl'.
            // when getting the source.  Preemptively run this to be safe.
            console.log("List workspaces");
            tfvcw.listWorkspaces();

            console.log("Current working directory: " + process.cwd());
            console.log("Add default workspace mappings: " + JSON.stringify(workspaceMappings));
            return tfvcw.mapFolder(workspaceMappings.serverPath, workspaceMappings.localPath, newWorkspace)
                .then(function (/** @type {number} */ retCode) {
                    if (retCode === 0) {
                        console.log("Successfully added default mapping");
                    }
                    return retCode;
                }, function (/** @type {unknown} */ error) {
                    tl.error("Failed to add default mapping. " + error);
                    process.exit(1);
                });
        })
        .then(function () {
            shell.cd(downloadPath);
            console.log("Sync workspace: " + newWorkspace.name);

            if (!changesetId) {
                console.log("Getting latest changeset as no changeset is specified");
            }

            return tfvcw.get(changesetId)
                .then(function (/** @type {number} */ retCode) {
                    if (retCode === 0) {
                        console.log("Successfully synced workspace");
                    }
                    return retCode;
                }, function (/** @type {unknown} */ error) {
                    tl.error("Failed to sync workspace. " + error);
                    process.exit(1);
                });
        });
};

/**
 * @param {string} folderPath
 */
function IsPathExists(folderPath) {
    return shell.test('-d', folderPath);
}

function getWorkspaceName() {
    const downloadFolderName = getDownloadFolder();
    console.log("Download artifact folder: " + downloadFolderName);
    const workspaceName = ("ws_" + downloadFolderName).slice(0, 60);
    console.log("workspace name: " + workspaceName);
    return workspaceName;
};

function getDownloadFolder() {
    return path.basename(downloadPath);
};

function getDefaultTfvcMappings() {
    return {
        type: "map",
        serverPath: "$" + "/" + repositoryId,
        localPath: downloadPath
    };
};

/**
 * @param {string} folderPath
 */
function ensurePathExist(folderPath) {
    if (!shell.test('-d', folderPath)) {
        shell.mkdir("-p", folderPath);
        console.log("Successfully created directory: " + folderPath);
    }
};

/**
 * @param {string} cmdLine
 * @returns {Promise<{ code: number, output: string }>}
 */
function utilExec(cmdLine) {
    return new Promise(function (resolve) {
        shell.exec(cmdLine, function (/** @type {number} */ code, /** @type {string} */ output) {
            resolve({ code: code, output: output });
        });
    });
};