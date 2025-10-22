var tl = require('azure-pipelines-task-lib/task');
var webApim = require('azure-devops-node-api/WebApi');
var Q = require('q');
var url = require('url');
var shell = require("shelljs");
var gitwm = require('./gitwrapper');
var auth = require('./auth');

var PullRefsPrefix = "refs/pull/";
var PullRefsOriginPrefix = "refs/remotes/origin/pull/";

var connectionType = tl.getInput("connectionType");
var isAdoConnectionType = connectionType === 'ado';

var serviceConnection = tl.getInput(isAdoConnectionType ? "azureDevOpsServiceConnection" : "connection");
var repositoryId = tl.getInput(isAdoConnectionType ? "definitionAdo" : "definition");
var projectId = tl.getInput(isAdoConnectionType ? "projectAdo" : "project");
var branch = tl.getInput(isAdoConnectionType ? "branchAdo" : "branch");
var commitId = tl.getInput(isAdoConnectionType ? "versionAdo" : "version");
var downloadPath = tl.getInput("downloadPath");
validateInputs(serviceConnection, repositoryId, projectId, branch, commitId, downloadPath);

var VSTS_HTTP_RETRY = 4;

shell.rm('-rf', downloadPath);
var error = shell.error();
if (error) {
    tl.error(error);
    tl.exit(1);
}

let connectionDetails;
let isPullRequest;
let gitw;
let gopt;

getServiceConnectionDetails().then(response => {
    connectionDetails = response;
    return getGitClientPromise(connectionDetails);
}).then(gitClient => {
    return getRepositoryDetails(gitClient, repositoryId, projectId);
}).then(gitRepository => {
    gitw = new gitwm.GitWrapper();
    gitw.on('stdout', data => console.log(data.toString()));
    gitw.on('stderr', data => console.log(data.toString()));

    var remoteUrl = gitRepository.remoteUrl;
    tl.debug('Remote Url:' + remoteUrl);
    var gu = url.parse(remoteUrl);
    if (connectionDetails.Username && connectionDetails.Password) {
        gu.auth = connectionDetails.Username + ':' + connectionDetails.Password;
    }

    var giturl = gu.format(gu);
    isPullRequest = !!branch && (branch.toLowerCase().startsWith(PullRefsPrefix) || branch.toLowerCase().startsWith(PullRefsOriginPrefix));
    tl.debug('IsPullRequest:' + isPullRequest);

    gopt = { creds: true, debugOutput: this.debugOutput };
    gitw.username = this.username;
    gitw.password = this.password;

    return executeWithRetries('gitClone', () => {
        return gitw.clone(giturl, true, downloadPath, gopt).then(result => {
            if (isPullRequest) {
                shell.cd(downloadPath);
                return gitw.fetch(['origin', branch], gopt);
            }
            return result;
        });
    }, VSTS_HTTP_RETRY);
}).then(() => {
    shell.cd(downloadPath);
    var ref = isPullRequest ? commitId : branch;
    return gitw.checkout(ref, gopt);
}).then(() => {
    if (!isPullRequest) {
        return gitw.checkout(commitId);
    }
}).catch(error => {
    tl.error(error);
    tl.setResult(tl.TaskResult.Failed, error);
});

function validateInputs(serviceConnection, repositoryId, projectId, branch, commitId, downloadPath) {
    if (!serviceConnection || serviceConnection.trim().length === 0) {
        throw new Error("Service connection is not provided.");
    }
    if (!repositoryId) {
        throw new Error("Repository is not provided.");
    }
    if (!projectId) {
        throw new Error("Project is not provided.");
    }
    if (!branch) {
        throw new Error("Branch is not provided.");
    }
if (!commitId) {
        throw new Error("Commit ID is not provided.");
    }
    if (!downloadPath) {
        throw new Error("Download path is not provided.");
    }
}

async function getServiceConnectionDetails() {
    if (isAdoConnectionType) {
        return getAdoScDetails(serviceConnection);
    }
    return getReposOrTfsScDetails(serviceConnection);
}

async function getAdoScDetails(serviceConnection) {
    var accessToken = await auth.getAccessTokenViaWorkloadIdentityFederation(serviceConnection);
    var hostUrl = tl.getVariable('System.TeamFoundationCollectionUri');
    return {
        "Url": hostUrl,
        "Username": ".", // Username not required for bearer handler; keep placeholder for consistency.
        "Password": accessToken,
        "Authorization": "Bearer " + accessToken
    };
}

function getReposOrTfsScDetails(serviceConnection) {
    var hostUrl = tl.getEndpointUrl(serviceConnection, false);
    if (!hostUrl) {
        throw new Error(errorMessage);
    }

    var auth = tl.getEndpointAuthorization(serviceConnection, false);
    if (auth.scheme != "UsernamePassword" && auth.scheme != "Token") {
        throw new Error("The authorization scheme " + auth.scheme + " is not supported for a External Tfs endpoint.");
    }

    var hostUsername = ".";
    var hostPassword = "";
    if (auth.scheme == "Token") {
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

function getGitClientPromise(connectionDetails) {
    let handler;
    if (connectionDetails.Authorization) {
        // Use bearer handler for ADO service connections that works with the access token.
        handler = webApim.getBearerHandler(connectionDetails.Password, true);
    } else {
        // For use cases where username/password or token scheme is used we rely on basic handler.
        handler = webApim.getBasicHandler(connectionDetails.Username, connectionDetails.Password);
    }
    var webApi = new webApim.WebApi(connectionDetails.Url, handler);
    return webApi.getCoreApi()
        .then(core => core.getProjects(undefined, 1))
        .then(projects => {
            tl.debug('Auth probe successful; projects (top1) count: ' + (projects ? projects.length : 0));
            return webApi.getGitApi();
        });
}

function getRepositoryDetails(gitClient, repositoryId, projectId) {
    return gitClient.getRepository(repositoryId, projectId).then(repo => {
        if (!repo) {
            throw new Error('Repository lookup returned null or undefined for id: ' + repositoryId + ', project: ' + projectId + '. Ensure the service connection has appropriate permissions.');
        }
        if (!repo.remoteUrl) {
            throw new Error('Repository object missing remoteUrl. This may indicate insufficient permissions or an API auth issue.');
        }
        return repo;
    });
}

function executeWithRetries(operationName, operation, currentRetryCount) {
    var deferred = Q.defer();
    operation().then(result => {
        deferred.resolve(result);
    }).fail(error => {
        if (currentRetryCount <= 0) {
            tl.error('OperationFailed: ' + operationName);
            tl.setResult(tl.TaskResult.Failed, error);
            deferred.reject(error);
        } else {
            console.log('RetryingOperation', operationName, currentRetryCount);
            currentRetryCount = currentRetryCount - 1;
            setTimeout(() => executeWithRetries(operationName, operation, currentRetryCount), 4 * 1000);
        }
    });
    return deferred.promise;
}