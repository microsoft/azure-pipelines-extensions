var tl = require('vsts-task-lib/task');
var path = require('path');
var webApim = require('vso-node-api/WebApi');
var gitInterfaces = require('vso-node-api/interfaces/GitInterfaces');
var Q = require('q');
var url = require('url');
var shell = require("shelljs");
var gitwm = require('./gitwrapper');

var PullRefsPrefix = "refs/pull/";
var PullRefsOriginPrefix = "refs/remotes/origin/pull/";

var repositoryId = tl.getInput("definition");
var projectId = tl.getInput("project");
var branch = tl.getInput("branch");
var commitId = tl.getInput("version");
var downloadPath = tl.getInput("downloadPath");
var tfsEndpoint = getEndpointDetails("connection");

shell.rm('-rf', downloadPath);
var error = shell.error();
if(error){
    tl.error(error);
    tl.exit(1);
}

var gitRepositoryPromise = getRepositoryDetails(tfsEndpoint, repositoryId, projectId);
Q.resolve(gitRepositoryPromise).then( function (gitRepository) {
    var gitw = new gitwm.GitWrapper();
    gitw.on('stdout', function (data) {
        console.log(data.toString());
    });
    gitw.on('stderr', function (data) {
        console.log(data.toString());
    });
    var remoteUrl = gitRepository.remoteUrl;
    tl.debug("Remote Url:" + remoteUrl);

    // encodes projects and repo names with spaces
    var gu = url.parse(remoteUrl);
    if (tfsEndpoint.Username && tfsEndpoint.Password) {
        gu.auth = tfsEndpoint.Username + ':' + tfsEndpoint.Password;
    }

    var giturl = gu.format(gu);
    var isPullRequest = !!branch && (branch.toLowerCase().startsWith(PullRefsPrefix) || branch.toLowerCase().startsWith(PullRefsOriginPrefix));
    tl.debug("IsPullRequest:" + isPullRequest);
    // if branch, we want to clone remote branch name to avoid tracking etc.. ('/refs/remotes/...')
    var ref;
    var brPre = 'refs/heads/';
    if (branch.startsWith(brPre)) {
        ref = 'refs/remotes/origin/' + branch.substr(brPre.length, branch.length - brPre.length);
    }
    else{
        ref = branch;
    }

    var gopt = {
        creds: true,
        debugOutput: this.debugOutput
    };
    gitw.username = this.username;
    gitw.password = this.password;
    Q(0).then(function (code) {
        return gitw.clone(giturl, true, downloadPath, gopt).then(function (result) {
            if (isPullRequest) {
                // clone doesn't pull the refs/pull namespace, so fetch it
                shell.cd(downloadPath);
                return gitw.fetch(['origin', branch], gopt);
            }
            else {
                return Q(result);
            }
        });
    }).then(function (code) {
        shell.cd(downloadPath);
        if (isPullRequest) {
            ref = commitId;
        }
        return gitw.checkout(ref, gopt);
    }).then(function (code) {
        if(!isPullRequest){
            return gitw.checkout(commitId);
        }
    }).fail(function (error) {
        tl.error(error);
        tl.exit(1);
    });
});

function getRepositoryDetails(tfsEndpoint, repositoryId, projectId){
    var handler = webApim.getBasicHandler(tfsEndpoint.Username, tfsEndpoint.Password);
    var gitClient = new webApim.WebApi(tfsEndpoint.Url, handler).getQGitApi();
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