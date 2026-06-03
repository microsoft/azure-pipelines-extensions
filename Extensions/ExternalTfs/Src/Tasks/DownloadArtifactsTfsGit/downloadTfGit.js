const url = require('url');

const tl = require('azure-pipelines-task-lib/task');
const webApim = require('azure-devops-node-api/WebApi');
const Q = require('q');
const shell = require("shelljs");

const gitwm = require('./gitwrapper');
const auth = require('./auth');
const GIT_CLONE_RETRY_ATTEMPTS = 4;

const connectionType = tl.getInput("connectionType");
const isAdoConnectionType = connectionType === 'ado';

const serviceConnection = tl.getInput(isAdoConnectionType ? "azureDevOpsServiceConnection" : "connection");
const repositoryId = tl.getInput(isAdoConnectionType ? "definitionAdo" : "definition");
const projectId = tl.getInput(isAdoConnectionType ? "projectAdo" : "project");
const branch = tl.getInput(isAdoConnectionType ? "branchAdo" : "branch");
const commitId = tl.getInput(isAdoConnectionType ? "versionAdo" : "version");
const downloadPath = tl.getInput("downloadPath");
validateInputs(serviceConnection, repositoryId, projectId, branch, commitId, downloadPath);

// @ts-ignore
shell.rm('-rf', downloadPath);
const error = shell.error();

if (error) {
    tl.error(error);
    process.exit(1);
}

/**
 * @typedef {Object} ConnectionDetails
 * @property {string} Url - The URL of the TFS server or Azure DevOps organization, obtained from the service connection endpoint.
 * @property {string} Username - The username for authentication, which may be a placeholder value (e.g., "oauth2") for Azure DevOps service connections using access tokens.
 * @property {string} [Password] - The password or token for authentication, which may be an access token for Azure DevOps service connections or a personal access token for TFS service connections.
 * @property {string} [AccessToken] - The access token for authentication, which is only applicable for Azure DevOps service connections using workload identity federation. This property may be undefined for TFS service connections or Azure DevOps service connections that do not use workload identity federation.
 */

/** @type {ConnectionDetails} */
let connectionDetails = {
    Url: '',
    Username: '',
    Password: undefined,
    AccessToken: undefined
};
/** @type {boolean} */
let isPullRequest;
/** @type {gitwm.GitWrapper} */
let git;

const gitOptions = {
    creds: true,
    debugOutput: !!process.env['SYSTEM_DEBUG']
};

getServiceConnectionDetails(serviceConnection).then(response => {
    connectionDetails = response;
    return getGitClientPromise(connectionDetails);
}).then(gitClient => {
    // @ts-ignore
    return getRepositoryRemoteUrl(gitClient, repositoryId, projectId);
}).then(repositoryRemoteUrl => {
    const gitReadyRepoUrl = prepareGitConsumableRepoUrl(repositoryRemoteUrl, connectionDetails);
    git = configureGitApiWrapper(connectionDetails);
    isPullRequest = isPullRequestBranch(branch);

    return executeWithRetries('gitClone', () => {
        return git
            // @ts-ignore
            .clone(gitReadyRepoUrl, true, downloadPath, gitOptions)
            .then((/** @type {any} */ result) => {
            if (isPullRequest) {
                shell.cd(downloadPath);
                // @ts-ignore
                return git.fetch(['origin', branch], gitOptions);
            }
            return result;
        });
    }, GIT_CLONE_RETRY_ATTEMPTS);
}).then(() => {
    shell.cd(downloadPath);
    const ref = isPullRequest ? commitId : branch;
    // @ts-ignore
    return git.checkout(ref, gitOptions);
}).then(() => {
    if (!isPullRequest) {
        // @ts-ignore
        return git.checkout(commitId);
    }
}).catch(error => {
    tl.error(error);
    tl.setResult(tl.TaskResult.Failed, error);
});

/**
 * Validates the inputs provided to the task, ensuring that all required parameters are present and not empty.
 * If any validation checks fail, an error is thrown with a descriptive message indicating which parameter is missing or invalid.
 * @param {string | undefined} serviceConnection - The name of the service connection in Azure DevOps, which is required to authenticate and access the Git repository.
 * @param {string | undefined} repositoryId - The ID of the Git repository to clone, which is required to identify the specific repository within the project.
 * @param {string | undefined} projectId - The ID of the Azure DevOps project that contains the Git repository, which is required to scope the repository lookup and ensure the correct repository is accessed.
 * @param {string | undefined} branch - The name of the branch to clone, which is required to specify which branch of the repository should be cloned.
 * @param {string | undefined} commitId - The ID of the specific commit to checkout after cloning, which is required to ensure that the correct version of the code is checked out for use in the pipeline.
 * @param {string | undefined} downloadPath - The local file system path where the Git repository should be cloned, which is required to specify where the code should be downloaded on the agent machine.
 * @throws {Error} If any of the required parameters are missing or invalid, an error is thrown with a descriptive message.
 */
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

/**
 * Gets the connection details for the specified service connection, including URL, username, password, and access token (if applicable).
 * @param {string | undefined} serviceConnection - The name of the service connection in Azure DevOps.
 * @returns {Promise<ConnectionDetails>} A promise that resolves to an object containing the connection details for the service connection.
 */
async function getServiceConnectionDetails(serviceConnection) {
    if (!serviceConnection) {
        throw new Error("Service connection is not provided.");
    }

    const hostUrl = tl.getEndpointUrl(serviceConnection, false);

    if (!hostUrl) {
        throw new Error(`Failed to get the URL for service connection ${serviceConnection}. Check if the service connection is valid and has the necessary permissions.`);
    }

    return isAdoConnectionType
        ? getAdoScDetails(serviceConnection, hostUrl)
        : getReposOrTfsScDetails(serviceConnection, hostUrl);
}

/**
 * Gets the connection details for an Azure DevOps service connection using workload identity federation, including exchanging the federated token for an access token.
 * @param {string} serviceConnection - The name of the Azure DevOps service connection in Azure DevOps.
 * @param {string} hostUrl - The URL of the Azure DevOps organization, obtained from the service connection endpoint.
 * @returns {Promise<ConnectionDetails>} A promise that resolves to an object containing the connection details for the Azure DevOps service connection, including the access token.
 */
async function getAdoScDetails(serviceConnection, hostUrl) {
    var accessToken = await auth.getAccessTokenViaWorkloadIdentityFederation(serviceConnection);
    if (accessToken) tl.setSecret(accessToken);
    return {
        "Url": hostUrl,
        "Username": "oauth2",
        "Password": accessToken,
        "AccessToken": accessToken
    };
}

/**
 * Gets the connection details for a TFS service connection, which may use either token-based or username/password-based authentication.
 * @param {string} serviceConnection - The name of the service connection in Azure DevOps.
 * @param {string} hostUrl - The URL of the TFS server, obtained from the service connection endpoint.
 * @returns {ConnectionDetails} An object containing the connection details for the TFS service connection, including URL, username, and password (which may be a personal access token).
 */
function getReposOrTfsScDetails(serviceConnection, hostUrl) {
    const auth = tl.getEndpointAuthorization(serviceConnection, false);

    if (!auth) {
        throw new Error(`Failed to get authorization details for service connection ${serviceConnection}. Check if the service connection is valid and has the necessary permissions.`);
    }

    if (auth.scheme != "UsernamePassword" && auth.scheme != "Token") {
        throw new Error("The authorization scheme " + auth.scheme + " is not supported for a External Tfs endpoint.");
    }

    let hostUsername = ".";
    let hostPassword = "";

    if (auth.scheme == "Token") {
        hostPassword = getAuthParameter(auth, 'apitoken');
    } else {
        hostUsername = getAuthParameter(auth, 'username');
        hostPassword = getAuthParameter(auth, 'password');
    }

    if (hostPassword) tl.setSecret(hostPassword);

    return {
        "Url": hostUrl,
        "Username": hostUsername,
        "Password": hostPassword
    };
}

/**
 * Helper function to get authorization parameters from the service connection authorization object, with case-insensitive key matching.
 * @param {Object} auth - The authorization object obtained from the service connection, which contains the parameters in a 'parameters' property.
 * @param {string} paramName - The name of the parameter to retrieve (e.g., 'username', 'password', 'apitoken').
 * @returns {string} The value of the requested authorization parameter.
 */
function getAuthParameter(auth, paramName) {
    let paramValue = null;
    // @ts-ignore
    const parameters = Object.getOwnPropertyNames(auth['parameters']);
    let keyName;
    parameters.some(function (key) {
        if (key.toLowerCase() === paramName.toLowerCase()) {
            keyName = key;
            return true;
        }
    });
    // @ts-ignore
    paramValue = auth['parameters'][keyName];
    return paramValue;
}

/**
 * Gets a Git client for the TFS/Azure Repos service connection, using the appropriate authentication handler based on the connection details.
 * @param {ConnectionDetails} connectionDetails - An object containing the connection details for the service connection, including URL, username, password, and access token (if applicable).
 * @returns {Promise<import('azure-devops-node-api/GitApi').IGitApi>} A promise that resolves to a Git client for the specified service connection.
 */
function getGitClientPromise(connectionDetails) {
    let handler;
    if (connectionDetails.AccessToken) {
        // Use bearer handler for ADO service connections that works with the access token.
        handler = webApim.getBearerHandler(connectionDetails.AccessToken, true);
    } else {
        if (!connectionDetails.Password) {
            throw new Error("Password is not provided for the service connection.");
        }

        // For use cases where username/password or token scheme is used we rely on basic handler.
        handler = webApim.getBasicHandler(connectionDetails.Username, connectionDetails.Password);
    }

    const webApi = new webApim.WebApi(connectionDetails.Url, handler);
    return webApi.getGitApi();
}

/**
 * Gets the remote URL for the Git repository specified by the repository ID and project ID, using the provided Git client. This function also includes error handling to provide more informative error messages in case of failures, such as insufficient permissions or authentication issues.
 * @param {import('azure-devops-node-api/GitApi').IGitApi} gitClient
 * @param {string} repositoryId
 * @param {string} projectId
 * @returns {Promise<string>} A promise that resolves to the remote URL of the specified Git repository.
 */
function getRepositoryRemoteUrl(gitClient, repositoryId, projectId) {
    return gitClient.getRepository(repositoryId, projectId).then(repo => {
        if (!repo) {
            throw new Error(
                'Repository lookup returned null or undefined for id: ' + repositoryId + ', project: ' + projectId +
                '. Ensure the service connection has appropriate permissions.');
        }

        const remoteUrl = repo.remoteUrl;

        if (!remoteUrl) {
            throw new Error('Repository object missing remoteUrl. This may indicate insufficient permissions or an API auth issue.');
        }

        tl.debug('Repository remote URL:' + remoteUrl);
        return remoteUrl;
    });
}

/**
 * Prepares a Git repository URL for consumption by including authentication details if provided.
 * @param {string} repoUrl - The URL of the Git repository.
 * @param {ConnectionDetails} connectionDetails - An object containing the connection details for the service connection, including URL, username, password, and access token (if applicable).
 * @returns {string} The Git repository URL with authentication details included, if available.
 */
function prepareGitConsumableRepoUrl(repoUrl, connectionDetails) {
    const parsedRepoUrl = url.parse(repoUrl);

    if (connectionDetails.Username && connectionDetails.Password) {
        parsedRepoUrl.auth = connectionDetails.Username + ':' + connectionDetails.Password;
    }

    return url.format(parsedRepoUrl);
}

/**
 * Configures a Git API wrapper with the provided connection details, including username and password.
 * @param {ConnectionDetails} connectionDetails - An object containing the connection details for the service connection, including URL, username, password, and access token (if applicable).
 * @returns {gitwm.GitWrapper} A configured Git API wrapper instance.
 */
function configureGitApiWrapper(connectionDetails) {
    // Create a wrapper around the git CLI so we can call clone/fetch/checkout and stream its output to the logs.
    const gitApiWrapper = new gitwm.GitWrapper();
    // @ts-ignore
    gitApiWrapper.on('stdout', data => console.log(data.toString()));
    // @ts-ignore
    gitApiWrapper.on('stderr', data => console.log(data.toString()));

    // @ts-ignore
    gitApiWrapper.username = connectionDetails.Username;
    // @ts-ignore
    gitApiWrapper.password = connectionDetails.Password;
    // @ts-ignore
    return gitApiWrapper;
}

/**
 * Determines whether the specified branch is associated with a pull request.
 * @param {string | undefined} branch - The name of the branch to check.
 * @returns {boolean} True if the branch is associated with a pull request, false otherwise.
 */
function isPullRequestBranch(branch) {
    const isAssociatedWithPullRequest = !!branch && (branch.toLowerCase().startsWith("refs/pull/") || branch.toLowerCase().startsWith("refs/remotes/origin/pull/"));
    tl.debug('IsPullRequest:' + isAssociatedWithPullRequest);
    return isAssociatedWithPullRequest;
}

/**
 * Executes the specified operation with retries in case of failure, up to a maximum number of retry attempts. If the operation ultimately fails after all retry attempts are exhausted, the function logs an error and sets the task result to failed.
 * @param {string} operationName - The name of the operation being executed.
 * @param {function} operation - The operation to execute, which should return a promise.
 * @param {number} remainingRetryAttempts - The number of remaining retry attempts.
 * @returns {Promise<any>}
 */
function executeWithRetries(operationName, operation, remainingRetryAttempts) {
    const deferred = Q.defer();
    operation().then((/** @type {any} */ result) => {
        deferred.resolve(result);
    }).fail((/** @type {string} */ error) => {
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

    // @ts-ignore
    return deferred.promise;
}