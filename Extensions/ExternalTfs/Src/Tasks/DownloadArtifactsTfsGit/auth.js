const tl = require('azure-pipelines-task-lib/task');
const msal = require('@azure/msal-node');
const { getFederatedToken } = require('azure-pipelines-tasks-azure-arm-rest/azCliUtility');

/**
 * Gets an access token for a service connection using workload identity federation.
 * @param {string} serviceConnection - The name of the service connection in Azure DevOps.
 * @returns {Promise<string | undefined>} - The access token.
 */
async function getAccessTokenViaWorkloadIdentityFederation(serviceConnection) {
    const authorizationScheme = tl.getEndpointAuthorizationSchemeRequired(serviceConnection);
    if (authorizationScheme.toLowerCase() !== "workloadidentityfederation") {
        throw new Error(`Authorization scheme ${authorizationScheme} is not supported.`);
    }

    const servicePrincipalId = tl.getEndpointAuthorizationParameterRequired(serviceConnection, "serviceprincipalid");
    const tenantId = tl.getEndpointAuthorizationParameterRequired(serviceConnection, "tenantid");

    const authorityUrl =
        tl.getEndpointDataParameter(serviceConnection, "activeDirectoryAuthority", true) ||
        "https://login.microsoftonline.com/";

    tl.debug(`Getting federated token for service connection ${serviceConnection}`);
    let federatedToken = null;

    try {
        federatedToken = await getFederatedToken(serviceConnection);
    } catch (error) {
        tl.error(error);
    }

    if (!federatedToken || federatedToken.length == 0) {
        throw new Error(`Failed to get the federatedToken for service connection ${serviceConnection}`);
    }

    tl.debug(`Got federated token for service connection ${serviceConnection}`);
    try {
        tl.setSecret(federatedToken);
    } catch (e) {
        tl.debug('Failed to register secret for log masking: ' + e.message);
    }

    // Exchange federated token for service principal token
    return await getAccessTokenFromFederatedToken(servicePrincipalId, tenantId, federatedToken, authorityUrl);
}

/**
 * Exchanges a federated token for an access token using MSAL.
 * @param {string} servicePrincipalId - The ID of the service principal.
 * @param {string} tenantId - The ID of the Azure AD tenant.
 * @param {string} federatedToken - The federated token.
 * @param {string} authorityUrl - The authority URL.
 * @returns {Promise<string | undefined>} - The access token.
 */
async function getAccessTokenFromFederatedToken(servicePrincipalId, tenantId, federatedToken, authorityUrl) {
    const AzureDevOpsResourceId = "499b84ac-1321-427f-aa17-267ca6975798";

    // Use MSAL to get an access token using the service principal with a federated token
    tl.debug(`Using authority url: ${authorityUrl}`);
    tl.debug(`Using resource: ${AzureDevOpsResourceId}`);

    const config = {
        auth: {
            clientId: servicePrincipalId,
            authority: `${authorityUrl.replace(/\/+$/, "")}/${tenantId}`,
            clientAssertion: federatedToken,
        },
        system: {
            loggerOptions: {
                loggerCallback: (/** @type {any} */ _, /** @type {string} */ message) => {
                    tl.debug(message);
                },
                piiLoggingEnabled: false,
                logLevel: msal.LogLevel.Verbose,
            },
        },
    };

    const app = new msal.ConfidentialClientApplication(config);

    const request = {
        scopes: [`${AzureDevOpsResourceId}/.default`],
        skipCache: true,
    };

    const result = await app.acquireTokenByClientCredential(request);
    try {
        tl.setSecret(result?.accessToken);
    } catch (e) {
        tl.debug('Failed to register secret for log masking: ' + e.message);
    }

    tl.debug(`Got access token for service principal ${servicePrincipalId}`);

    if (result?.expiresOn) {
        const minutes = (result.expiresOn.getTime() - new Date().getTime()) / 60000;
        console.log(`Generated access token with expiration time of ${minutes} minutes.`);
    }

    return result?.accessToken;
}

module.exports = {
    getAccessTokenViaWorkloadIdentityFederation
};
