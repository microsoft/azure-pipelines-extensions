var shell = require('shelljs');
var path = require('path');
var tl = require('vsts-task-lib/task');
var webApim = require('vso-node-api/WebApi');
var tfvcInterfaces = require('vso-node-api/interfaces/TfvcInterfaces');
var Q = require('q');
var url = require('url');
var tfvcwm = require('./tfvcwrapper');

var projectId = tl.getInput("project");
var repositoryId = tl.getInput("definition");
var changesetId = tl.getInput("version");
var downloadPath = tl.getInput("downloadPath");
var tfsEndpoint = getEndpointDetails("connection");

console.log("project: " + projectId.toString());
console.log("definition: " + repositoryId.toString());
console.log("version: " + changesetId.toString());
console.log("downloadPath: " + downloadPath.toString());
console.log("tfsEndpoint:" + JSON.stringify(tfsEndpoint));

var tfvcw = new tfvcwm.TfvcWrapper();
tfvcw.on('stdout', function (data) {
    console.log(data.toString());
});
tfvcw.on('stderr', function (data) {
    console.log(data.toString());
});
tfvcw.on('debug', function (data) {
    console.log(data.toString());
});
tfvcw.setTfvcConnOptions({
    username: tfsEndpoint.Username,
    password: tfsEndpoint.Password,
    collection: tfsEndpoint.Url
});
getCode();

function getEndpointDetails(inputFieldName) {
    var errorMessage = "Could not decode the External Tfs endpoint. Please ensure you are running the latest agent";
    if (!tl.getEndpointUrl) {
        throw new Error(errorMessage);
    }
    var externalTfsEndpoint = tl.getInput(inputFieldName);
    if (!externalTfsEndpoint) {
        throw new Error(errorMessage);
    }
    var hostUrl = tl.getEndpointUrl(externalTfsEndpoint, false);
    if (!hostUrl) {
        throw new Error(errorMessage);
    }
    var auth = tl.getEndpointAuthorization(externalTfsEndpoint, false);
    if (auth.scheme != "UsernamePassword" && auth.scheme != "Token") {
        throw new Error("The authorization scheme " + auth.scheme + " is not supported for a External Tfs endpoint.");
    }

    var hostUsername = ".";
    var hostPassword = "";
    if(auth.scheme == "Token") {
        hostPassword = getAuthParameter(auth, 'apitoken');
    }
    else {
        hostUsername = getAuthParameter(auth, 'username');
        hostPassword = getAuthParameter(auth, 'password');
    }
    return {
        "Url": hostUrl,
        "Username": hostUsername,
        "Password": hostPassword
    };
}

function getAuthParameter(auth, paramName) {
    var paramValue = null;
    var parameters = Object.getOwnPropertyNames(auth['parameters']);
    var keyName;
    parameters.some(function (key) {
        if (key.toLowerCase() === paramName.toLowerCase()) {
            keyName = key;
            return true;
        }
    });
    paramValue = auth['parameters'][keyName];
    return paramValue;
}

function getCode() {
    var workspaceName = getWorkspaceName();
    var workspaceMappings = getDefaultTfvcMappings();

    var newWorkspace = {
        name: workspaceName,
        mappings: []
    };

    console.log("Try deleting workspace if it already exists");
    return tfvcw.deleteWorkspace(newWorkspace)
        .then(function(retCode) {
            if (retCode === 0) {
                console.log("Successfully deleted workspace");
            }
            if (IsPathExists(downloadPath)) {
                console.log("Cleaning up artifacts download path");
                return utilExec('rm -fr ' + downloadPath)
                    .then(function(ret) {
                        if (ret.code === 0) {
                            console.log("Successfully cleaned up artifacts download path");
                        }
                        return Q(ret.code);
                    });
            } else {
                return Q(0);
            }
        }, function(error) {
            console.log("Warning: Failed to delete Workspace. Ignoring it as this could happen due to non existent workspace. " + error);
            if (IsPathExists(downloadPath)) {
                console.log("Artifacts download path exists. Cleaning up");
                return utilExec('rm -fr ' + downloadPath)
                    .then(function(ret) {
                        if (ret.code === 0) {
                            console.log("Successfully cleaned up artifacts download path");
                        }
                        return Q(ret.code);
                    });
            } else {
                return Q(0);
            }
        })
        .then(function() {
            ensurePathExist(downloadPath);
            shell.cd(downloadPath);
            console.log("Creating new workspace: " + newWorkspace.name);
            return tfvcw.newWorkspace(newWorkspace)
                .then(function(retCode) {
                    if (retCode === 0) {
                        console.log("Successfully created workspace");
                    }
                    return Q(retCode);
                }, function(error) {
                    tl.error("Failed to Create a new Workspace. " + error);
                    tl.exit(1);
                });
        })
        .then(function() {
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
                .then(function(retCode) {
                    if (retCode === 0) {
                        console.log("Successfully added default mapping");
                    }
                    return Q(retCode);
                }, function(error) {
                    tl.error("Failed to add default mapping. " + error);
                    tl.exit(1);
                });
        })
        .then(function() {
            shell.cd(downloadPath);
            console.log("Sync workspace: " + newWorkspace.name);
            return tfvcw.get(changesetId)
                .then(function(retCode) {
                    if (retCode === 0) {
                        console.log("Successfully synced workspace");
                    }
                    return Q(retCode);
                }, function(error) {
                    tl.error("Failed to sync workspace. " + error);
                    tl.exit(1);
                });
        });
};

function IsPathExists(path) {
    return shell.test('-d', path);
}

function getWorkspaceName() {
    var downloadFolderName = getDownloadFolder();
    console.log("Download artifact folder: " + downloadFolderName);
    var workspaceName = ("ws_" + downloadFolderName).slice(0, 60);
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

function ensurePathExist(path) {
    if (!shell.test('-d', path)) {
        shell.mkdir("-p", path);
        console.log("Successfully created directory: " + path);
    }
};

// ret is { output: string, code: number }
function utilExec(cmdLine) {
    var defer = Q.defer();
    shell.exec(cmdLine, function (code, output) {
        defer.resolve({ code: code, output: output });
    });
    return defer.promise;
};