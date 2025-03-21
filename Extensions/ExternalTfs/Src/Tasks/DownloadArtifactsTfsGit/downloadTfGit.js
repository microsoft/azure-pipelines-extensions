var tl = require('azure-pipelines-task-lib/task');
var path = require('path');
var webApim = require('azure-devops-node-api/WebApi');
var Q = require('q');
var url = require('url');
var shell = require("shelljs");
var gitwm = require('./gitwrapper');
var auth = require('./auth')

var PullRefsPrefix = "refs/pull/";
var PullRefsOriginPrefix = "refs/remotes/origin/pull/";

var repositoryId = tl.getInput("definition");
var projectId = tl.getInput("project");
var branch = tl.getInput("branch");
var commitId = tl.getInput("version");
var downloadPath = tl.getInput("downloadPath");
var VSTS_HTTP_RETRY = 4;

shell.rm('-rf', downloadPath);
var error = shell.error();
if (error) {
    tl.error(error);
    tl.exit(1);
}

function executeWithRetries(operationName, operation, currentRetryCount) {
    var deferred = Q.defer()
    operation().then((result) => {
        deferred.resolve(result)
    }).fail((error) => {
        if (currentRetryCount <= 0) {
            tl.error('OperationFailed: ' + operationName)
            tl.setResult(tl.TaskResult.Failed, error);
            deferred.reject(error)
        } else {
            console.log('RetryingOperation', operationName, currentRetryCount)
            currentRetryCount = currentRetryCount - 1
            setTimeout(() => executeWithRetries(operationName, operation, currentRetryCount), 4 * 1000)
        }
    })

    return deferred.promise
}

let tfsEndpoint;
let isPullRequest;
let gitw;
let gopt;

getServiceConnection().then(endpoint => {
    tfsEndpoint = endpoint;
    return getGitClientPromise(tfsEndpoint);
}).then(gitClient => {
    var gitRepositoryPromise = getRepositoryDetails(gitClient, repositoryId, projectId);
    return gitRepositoryPromise;
}).then(gitRepository => {
    gitw = new gitwm.GitWrapper();
    gitw.on('stdout', data => console.log(data.toString()));
    gitw.on('stderr', data => console.log(data.toString()));

    var remoteUrl = gitRepository.remoteUrl;
    tl.debug("Remote Url:" + remoteUrl);

    var gu = url.parse(remoteUrl);
    if (tfsEndpoint.Username && tfsEndpoint.Password) {
        gu.auth = tfsEndpoint.Username + ':' + tfsEndpoint.Password;
    }

    var giturl = gu.format(gu);
    isPullRequest = !!branch && (branch.toLowerCase().startsWith(PullRefsPrefix) || branch.toLowerCase().startsWith(PullRefsOriginPrefix));
    tl.debug("IsPullRequest:" + isPullRequest);

    var ref = branch.startsWith('refs/heads/') ? `refs/remotes/origin/${branch.substr('refs/heads/'.length)}` : branch;

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

async function getServiceConnection() {
    if(isAdoServiceConnectionSet()) {
        return getADOServiceConnectionDetails();
    }
    return getEndpointDetails("connection");
}

function getGitClientPromise(tfsEndpoint) {
    var handler = webApim.getBasicHandler(tfsEndpoint.Username, tfsEndpoint.Password);
    var webApi = new webApim.WebApi(tfsEndpoint.Url, handler);
    return webApi.getGitApi();
}

function getRepositoryDetails(gitClient, repositoryId, projectId) {
    var promise = gitClient.getRepository(repositoryId, projectId);
    return promise;
}

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

function isAdoServiceConnectionSet() {
    const connectedServiceName = tl.getInput("azureDevOpsServiceConnection", false);
    return connectedServiceName && connectedServiceName.trim().length > 0;
}

async function getADOServiceConnectionDetails() {
    const connectedServiceName = tl.getInput("azureDevOpsServiceConnection", false);
    if (connectedServiceName && connectedServiceName.trim().length > 0) {
        accessToken = await auth.getAccessTokenViaWorkloadIdentityFederation(connectedServiceName);
        hostUrl = tl.getVariable('System.TeamFoundationCollectionUri');
        return {
            "Url": hostUrl,
            "Username": ".",
            "Password": accessToken
        }; 
    } else {
        var errorMessage = "Could not decode the AzureDevOpsServiceConnection. Please ensure you are running the latest agent";
        throw new Error(errorMessage);
    }
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