const tl = require('azure-pipelines-task-lib/task');
const msal = require('@azure/msal-node');
const { getFederatedToken } = require('azure-pipelines-tasks-artifacts-common/webapi');

const workloadIdentityFederation = "workloadidentityfederation";

async function getAccessTokenViaWorkloadIdentityFederation(connectedService) {
    const authorizationScheme = tl
        .getEndpointAuthorizationSchemeRequired(connectedService)
        .toLowerCase();

    if (authorizationScheme !== workloadIdentityFederation) {
        throw new Error(`Authorization scheme ${authorizationScheme} is not supported.`);
    }

    const servicePrincipalId = tl.getEndpointAuthorizationParameterRequired(connectedService, "serviceprincipalid");
    const servicePrincipalTenantId = tl.getEndpointAuthorizationParameterRequired(connectedService, "tenantid");

    const authorityUrl =
        tl.getEndpointDataParameter(connectedService, "activeDirectoryAuthority", true) || "https://login.microsoftonline.com/";

    tl.debug(`Getting federated token for service connection ${connectedService}`);

    let federatedToken = null;

    try {
        federatedToken = await getFederatedToken(connectedService);
    } catch (error) {
        tl.error(error);
    }
    
    if (!federatedToken || federatedToken.length == 0) {
        throw new Error(`Failed to get the federatedToken for service connection ${connectedService}`);
    }
    
    tl.debug(`Got federated token for service connection ${connectedService}`);

    // Exchange federated token for service principal token
    return await getAccessTokenFromFederatedToken(servicePrincipalId, servicePrincipalTenantId, federatedToken, authorityUrl);
}

async function getAccessTokenFromFederatedToken(servicePrincipalId, servicePrincipalTenantId, federatedToken, authorityUrl) {
    const AzureDevOpsResourceId = "499b84ac-1321-427f-aa17-267ca6975798";

    // Use MSAL to get an access token using the service principal with a federated token
    tl.debug(`Using authority url: ${authorityUrl}`);
    tl.debug(`Using resource: ${AzureDevOpsResourceId}`);

    const config = {
        auth: {
            clientId: servicePrincipalId,
            authority: `${authorityUrl.replace(/\/+$/, "")}/${servicePrincipalTenantId}`,
            clientAssertion: federatedToken,
        },
        system: {
            loggerOptions: {
                loggerCallback: (level, message, containsPii) => {
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
