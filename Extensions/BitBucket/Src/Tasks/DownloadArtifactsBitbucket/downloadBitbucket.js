const fs = require('fs');
const https = require('https');
const url = require('url');
const path = require('path');

const tl = require('azure-pipelines-task-lib/task');

const scw = require('./sourcecontrolwrapper.js');

/**
 * @typedef {Object} EndpointDetails
 * @property {string} [Username] - The username for the endpoint.
 * @property {string} [Password] - The password for the endpoint (if using username/password authentication).
 * @property {string | null} [Token] - The token for the endpoint (if using token authentication).
 */

/**
 * @typedef {Object} IBitbucketResponseLinksHref
 * @property {string} href - The URL of the link.
 */

/**
 * @typedef {Object} IBitbucketResponseLinks
 * @property {IBitbucketResponseLinksHref[]} clone - An array of clone links for the repository.
 */

/**
 * @typedef {Object} IBitbucketResponse
 * @property {string} scm - The source control management type (e.g., "git").
 * @property {IBitbucketResponseLinks} links - The links object containing repository links.
 */

const BITBUCKET_API_TOKEN_AUTH_USERNAME = 'x-bitbucket-api-token-auth';

const repositoryId = tl.getInputRequired('definition');
const branch = tl.getInputRequired('branch');
const commitId = tl.getInputRequired('version');
const downloadPath = tl.getInputRequired('downloadPath');
const bitbucketEndpoint = getEndpointDetails('connection');

try {
    removePathRecursive(downloadPath);
} catch (error) {
    tl.setResult(tl.TaskResult.Failed, error.message || error);
    process.exit(1);
}

const options = {
    host: 'api.bitbucket.org',
    method: 'GET',
    path: '/2.0/repositories/' + repositoryId,
    auth: ''
};

// Set authentication based on the endpoint type
if (bitbucketEndpoint.Token) {
    options.auth = bitbucketEndpoint.Username + ':' + bitbucketEndpoint.Token;
} else if (bitbucketEndpoint.Username && bitbucketEndpoint.Password) {
    options.auth = bitbucketEndpoint.Username + ':' + bitbucketEndpoint.Password;
}

https.request(options, function (rs) {
    tl.debug(`HTTP status: ${rs.statusCode} ${rs.statusMessage}`);
    /** @type {IBitbucketResponse} */
    let result;
    let response = '';
    rs.on('data', function (data) {
        tl.debug('repository details:' + data)
        response += data
    });
    rs.on('end', function () {
        const statusCode = rs.statusCode || 0;
        if (statusCode < 200 || statusCode >= 300) {
            tl.setResult(tl.TaskResult.Failed, 'Failed to get repository details from Bitbucket. HTTP status: ' + statusCode + ' ' + rs.statusMessage + '. Response: ' + response);
            process.exit(1);
        }

        try {
            result = JSON.parse(response);
        } catch (error) {
            tl.setResult(tl.TaskResult.Failed, 'Failed to parse Bitbucket API response as JSON. Response: ' + response);
            process.exit(1);
        }

        tl.debug('result:' + JSON.stringify(result));
        const sch = new scw.SourceControlWrapper(result.scm);

        sch.on('stdout', function (/** @type {{ toString: () => any; }} */ data) {
            console.log(data.toString());
        });
        sch.on('stderr', function (/** @type {{ toString: () => any; }} */ data) {
            console.log(data.toString());
        });

        let remoteUrl = "";

        if (result.links.clone[0]) {
            remoteUrl = result.links.clone[0].href;
        }

        if (!remoteUrl) {
            tl.setResult(tl.TaskResult.Failed, 'Failed to resolve the repository clone URL from the Bitbucket API response.');
            process.exit(1);
        }

        tl.debug('Remote Url:' + remoteUrl);

        // encodes projects and repo names with spaces
        const repoUrl = url.parse(remoteUrl);
        if (bitbucketEndpoint.Token) {
            // For token authentication, use the token as password with API token auth username
            repoUrl.auth = BITBUCKET_API_TOKEN_AUTH_USERNAME + ':' + bitbucketEndpoint.Token;
        } else if (bitbucketEndpoint.Username && bitbucketEndpoint.Password) {
            repoUrl.auth = bitbucketEndpoint.Username + ':' + bitbucketEndpoint.Password;
        }

        /**
         * @type {string | undefined} - If branch, we want to clone remote branch name to avoid tracking etc.. ('/refs/remotes/...')
         */
        let ref;
        const brPre = 'refs/heads/';

        if (branch.startsWith(brPre)) {
            ref = 'refs/remotes/origin/' + branch.substr(brPre.length, branch.length - brPre.length);
        } else {
            ref = branch;
        }

        const options = {
            creds: true,
            debugOutput: false
        };
        if (bitbucketEndpoint.Token) {
            sch.username = BITBUCKET_API_TOKEN_AUTH_USERNAME;
            sch.password = bitbucketEndpoint.Token;
        } else {
            sch.username = bitbucketEndpoint.Username;
            sch.password = bitbucketEndpoint.Password;
        }

        Promise.resolve()
            .then(function () {
                return sch.clone(url.format(repoUrl), false, downloadPath, options);
            })
            .then(function () {
                process.chdir(downloadPath);
                return sch.checkout(ref || '', options);
            })
            .then(function () {
                return sch.checkout(commitId);
            })
            .catch(function (error) {
                tl.setResult(tl.TaskResult.Failed, error.message || error);
                process.exit(1);
            });
    });
}).end();

/**
 * @todo Replace this method to the native fs.rmSync() method when we drop support of Node@6.
 * Removes a file or directory recursively.
 * @param {string} targetPath - The path to the file or directory to remove.
 * @returns {void}
 */
function removePathRecursive(targetPath) {
    if (!targetPath || !fs.existsSync(targetPath)) {
        return;
    }

    const stat = fs.lstatSync(targetPath);
    if (!stat.isDirectory()) {
        fs.unlinkSync(targetPath);
        return;
    }

    fs.readdirSync(targetPath).forEach(function (entry) {
        removePathRecursive(path.join(targetPath, entry));
    });

    fs.rmdirSync(targetPath);
}

/**
 * Gets the endpoint details for the given input field name.
 * @param {string} inputFieldName - The name of the input field to get the endpoint details for.
 * @returns {EndpointDetails} An object containing the endpoint details, including the username and either the password or token.
 */
function getEndpointDetails(inputFieldName) {
    const bitbucketEndpoint = tl.getInputRequired(inputFieldName);
    const auth = tl.getEndpointAuthorization(bitbucketEndpoint, false);
    if (!auth || !auth.scheme) {
        throw new Error('Failed to get authorization details for service connection ' + bitbucketEndpoint + '.');
    }

    const scheme = auth.scheme.toLowerCase().trim();

    if (scheme === 'token') {
        const token = getAuthParameter(bitbucketEndpoint, 'apitoken');

        if (!token) {
            throw new Error('The endpoint ' + bitbucketEndpoint + ' does not have an API token parameter.');
        }

        const username = getAuthParameter(bitbucketEndpoint, 'email') || '';
        tl.debug('Using token authentication');

        try {
            tl.setSecret(token);
        } catch (e) {
            tl.warning('Failed to mask API token for log redaction.');
        }

        return {
            'Token': token,
            'Username': username
        };
    } else {
        const hostUsername = getAuthParameter(bitbucketEndpoint, 'username');
        const hostPassword = getAuthParameter(bitbucketEndpoint, 'password');

        if (hostUsername === undefined || hostPassword === undefined) {
            throw new Error('The endpoint ' + bitbucketEndpoint + ' does not have the required username and password parameters.');
        }

        try {
            tl.setSecret(hostPassword);
        } catch (e) {
            tl.warning('Failed to mask password for log redaction.');
        }

        tl.debug('hostUsername: ' + hostUsername);

        return {
            'Username': hostUsername,
            'Password': hostPassword
        };
    }
}

/**
 * Gets the value of the specified authorization parameter from the given endpoint.
 * @param {string} endpoint - The endpoint from which to retrieve the authorization parameter.
 * @param {string} paramName - The name of the authorization parameter to retrieve.
 * @returns {string|undefined} The value of the authorization parameter, or undefined if not found.
 */
function getAuthParameter(endpoint, paramName) {
    const auth = tl.getEndpointAuthorization(endpoint, false);

    if (!auth || !auth.parameters) {
        throw new Error('The endpoint ' + endpoint + ' does not have any authorization parameters.');
    }

    if (auth.scheme === undefined) {
        throw new Error('The endpoint ' + endpoint + ' does not have an authorization scheme defined.');
    }

    const scheme = auth.scheme.toLowerCase().trim();

    if (scheme !== 'usernamepassword' && scheme !== 'token') {
        throw new Error('The authorization scheme ' + auth.scheme + ' is not supported for a bitbucket endpoint. Please use either "usernamepassword" or "token".');
    }

    const keyName = Object.getOwnPropertyNames(auth['parameters']).find(function (x) { return x.toLowerCase() === paramName.toLowerCase(); });
    return keyName ? auth['parameters'][keyName] : undefined;
}
