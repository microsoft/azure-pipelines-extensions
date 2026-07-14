var tl = require('azure-pipelines-task-lib/task');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var url = require('url');
var scw = require('./sourcecontrolwrapper.js');
var https = require("https");

var BITBUCKET_API_TOKEN_AUTH_USERNAME = 'x-bitbucket-api-token-auth';

var repositoryId = tl.getInput("definition", true);
var branch = tl.getInput("branch", true);
var commitId = tl.getInput("version", true);
var downloadPath = tl.getInput("downloadPath", true);
var bitbucketEndpoint = getEndpointDetails("connection");

removePathRecursive(downloadPath);

var options = {
    host: "api.bitbucket.org",
    method: "GET",
    path: "/2.0/repositories/" + repositoryId
};

// Set authentication based on the endpoint type
if (bitbucketEndpoint.Token) {
    options.auth = bitbucketEndpoint.Username + ':' + bitbucketEndpoint.Token;
} else if (bitbucketEndpoint.Username && bitbucketEndpoint.Password) {
    options.auth = bitbucketEndpoint.Username + ':' + bitbucketEndpoint.Password;
}

https.request(options, function (rs) {
    tl.debug(`HTTP status: ${rs.statusCode} ${rs.statusMessage}`);
    var result;
    var response = '';
    rs.on('data', function (data) {
        tl.debug("repository details:" + data)
        response += data
    });
    rs.on('end', function () {
        result = JSON.parse(response);
        tl.debug("result:" + JSON.stringify(result));
        var sch = new scw.SourceControlWrapper(result.scm);

        sch.on('stdout', function (data) {
            console.log(data.toString());
        });
        sch.on('stderr', function (data) {
            console.log(data.toString());
        });

        var remoteUrl = result.links.clone[0].href;
        tl.debug("Remote Url:" + remoteUrl);

        // encodes projects and repo names with spaces
        var repoUrl = url.parse(remoteUrl);
        if (bitbucketEndpoint.Token) {
            // For token authentication, use the token as password with API token auth username
            repoUrl.auth = BITBUCKET_API_TOKEN_AUTH_USERNAME + ':' + bitbucketEndpoint.Token;
        } else if (bitbucketEndpoint.Username && bitbucketEndpoint.Password) {
            repoUrl.auth = bitbucketEndpoint.Username + ':' + bitbucketEndpoint.Password;
        }

        // if branch, we want to clone remote branch name to avoid tracking etc.. ('/refs/remotes/...')
        var ref;
        var brPre = 'refs/heads/';
        if (branch.startsWith(brPre)) {
            ref = 'refs/remotes/origin/' + branch.substr(brPre.length, branch.length - brPre.length);
        }
        else {
            ref = branch;
        }

        var options = {
            creds: true,
            debugOutput: this.debugOutput
        };
        if (bitbucketEndpoint.Token) {
            sch.username = BITBUCKET_API_TOKEN_AUTH_USERNAME;
            sch.password = bitbucketEndpoint.Token;
        } else {
            sch.username = bitbucketEndpoint.Username;
            sch.password = bitbucketEndpoint.Password;
        }

        Q(0).then(function (code) {
            return sch.clone(repoUrl.format(repoUrl), false, downloadPath, options)
                .then(function (code) {
                    process.chdir(downloadPath);
                    return sch.checkout(ref, options);
                })
                .then(function (code) {
                    return sch.checkout(commitId);
                })
                .catch(function (error) {
                    tl.error(error);
                    tl.exit(1);
                });
        });
    });
}).end();

function getEndpointDetails(inputFieldName) {
    var bitbucketEndpoint = tl.getInput(inputFieldName, true);
    var auth = tl.getEndpointAuthorization(bitbucketEndpoint, false);
    var scheme = auth.scheme.toLowerCase().trim();

    if (scheme === "token") {
        var token = getAuthParameter(bitbucketEndpoint, 'apitoken');
        var username = getAuthParameter(bitbucketEndpoint, 'email') || '';
        tl.debug('Using token authentication');
        try {
            tl.setSecret(token);
        } catch (err) {
            tl.warning('Failed to mask API token for log redaction.');
        }
        return {
            "Token": token,
            "Username": username
        };
    } else {
        var hostUsername = getAuthParameter(bitbucketEndpoint, 'username');
        var hostPassword = getAuthParameter(bitbucketEndpoint, 'password');
        try {
            tl.setSecret(hostPassword);
        } catch (err) {
            tl.warning('Failed to mask password for log redaction.');
        }
        tl.debug('hostUsername: ' + hostUsername);
        return {
            "Username": hostUsername,
            "Password": hostPassword
        };
    }
}

function getAuthParameter(endpoint, paramName) {
    var paramValue = null;
    var auth = tl.getEndpointAuthorization(endpoint, false);
    var scheme = auth.scheme.toLowerCase().trim();

    if (scheme !== "usernamepassword" && scheme !== "token") {
        throw new Error("The authorization scheme " + auth.scheme + " is not supported for a bitbucket endpoint. Please use either 'usernamepassword' or 'token'.");
    }

    var keyName = getCaseInsensitiveKeyMatch(auth['parameters'], paramName);
    paramValue = auth['parameters'][keyName];

    return paramValue;
}

function getCaseInsensitiveKeyMatch(data, paramName) {
    var keyName;
    var parameters = Object.getOwnPropertyNames(data);
    parameters.some(function (key) {
        if (key.toLowerCase() === paramName.toLowerCase()) {
            keyName = key;
            return true;
        }
    });

    return keyName;
}

function removePathRecursive(targetPath) {
    if (!targetPath || !fs.existsSync(targetPath)) {
        return;
    }

    var stats = fs.lstatSync(targetPath);
    if (!stats.isDirectory()) {
        fs.unlinkSync(targetPath);
        return;
    }

    fs.readdirSync(targetPath).forEach(function (entry) {
        removePathRecursive(path.join(targetPath, entry));
    });

    fs.rmdirSync(targetPath);
}
