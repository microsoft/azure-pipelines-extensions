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

var GIT_CLONE_RETRY_ATTEMPTS = 4;

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
    return getRepositoryRemoteUrl(gitClient, repositoryId, projectId);
}).then(repositoryRemoteUrl => {
    gitw = new gitwm.GitWrapper();
    gitw.on('stdout', data => console.log(data.toString()));
    gitw.on('stderr', data => console.log(data.toString()));
    
    var gu = url.parse(repositoryRemoteUrl);
    if (connectionDetails.Username && connectionDetails.Password) {
        gu.auth = connectionDetails.Username + ':' + connectionDetails.Password;
    }

    var giturl = url.format(gu);
    isPullRequest = !!branch && (branch.toLowerCase().startsWith(PullRefsPrefix) || branch.toLowerCase().startsWith(PullRefsOriginPrefix));
    tl.debug('IsPullRequest:' + isPullRequest);

    gopt = { creds: true, debugOutput: this.debugOutput };
    gitw.username = connectionDetails.Username;
    gitw.password = connectionDetails.Password;

    return executeWithRetries('gitClone', () => {
        return gitw.clone(giturl, true, downloadPath, gopt).then(result => {
            if (isPullRequest) {
                shell.cd(downloadPath);
                return gitw.fetch(['origin', branch], gopt);
            }
            return result;
        });
    }, GIT_CLONE_RETRY_ATTEMPTS);
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
    var hostUrl = tl.getEndpointUrl(serviceConnection, false);
    if (!hostUrl) {
        throw new Error(errorMessage);
    }
    
    return isAdoConnectionType
        ? getAdoScDetails(serviceConnection, hostUrl)
        : getReposOrTfsScDetails(serviceConnection, hostUrl);
}

async function getAdoScDetails(serviceConnection, hostUrl) {
    var accessToken = await auth.getAccessTokenViaWorkloadIdentityFederation(serviceConnection);
    return {
        "Url": hostUrl,
        "Username": "oauth2",
        "Password": accessToken,
        "AccessToken": accessToken
    };
}

function getReposOrTfsScDetails(serviceConnection, hostUrl) {
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
    if (connectionDetails.AccessToken) {
        // Use bearer handler for ADO service connections that works with the access token.
        handler = webApim.getBearerHandler(connectionDetails.AccessToken, true);
    } else {
        // For use cases where username/password or token scheme is used we rely on basic handler.
        handler = webApim.getBasicHandler(connectionDetails.Username, connectionDetails.Password);
    }

    var webApi = new webApim.WebApi(connectionDetails.Url, handler);
    return webApi.getGitApi();
}

function getRepositoryRemoteUrl(gitClient, repositoryId, projectId) {
    return gitClient.getRepository(repositoryId, projectId).then(repo => {
        if (!repo) {
            throw new Error(
                'Repository lookup returned null or undefined for id: ' + repositoryId + ', project: ' + projectId +
                '. Ensure the service connection has appropriate permissions.');
        }
    
        var remoteUrl = repo.remoteUrl;
        if (!remoteUrl) {
            throw new Error('Repository object missing remoteUrl. This may indicate insufficient permissions or an API auth issue.');
        }

        tl.debug('Repository remote URL:' + remoteUrl);
        return remoteUrl;
    });
}

function executeWithRetries(operationName, operation, remainingRetryAttempts) {
    var deferred = Q.defer();
    operation().then(result => {
        deferred.resolve(result);
    }).fail(error => {
        if (remainingRetryAttempts <= 0) {
            tl.error('OperationFailed: ' + operationName);
            tl.setResult(tl.TaskResult.Failed, error);
            deferred.reject(error);
        } else {
            tl.debug('RetryingOperation: ' + operationName + ', remainingRetryAttempts: ' + remainingRetryAttempts);
            remainingRetryAttempts = remainingRetryAttempts - 1;
            setTimeout(() => executeWithRetries(operationName, operation, remainingRetryAttempts), 4 * 1000);
        }
    });
    return deferred.promise;
}