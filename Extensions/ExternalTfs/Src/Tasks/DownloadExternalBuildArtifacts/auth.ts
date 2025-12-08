import tl = require('azure-pipelines-task-lib-nr-test/task');
import * as msal from "@azure/msal-node";
import { getFederatedToken } from "azure-pipelines-tasks-azure-arm-rest/azCliUtility";

export async function getAccessTokenViaWorkloadIdentityFederation(serviceConnection: string): Promise<string> {
  const authorizationScheme = tl.getEndpointAuthorizationSchemeRequired(serviceConnection);
  if (authorizationScheme.toLowerCase() !== "workloadidentityfederation") {
    throw new Error(`Authorization scheme ${authorizationScheme} is not supported.`);
  }

  var servicePrincipalId: string =
    tl.getEndpointAuthorizationParameterRequired(serviceConnection, "serviceprincipalid");

  var tenantId: string =
    tl.getEndpointAuthorizationParameterRequired(serviceConnection, "tenantid");

  const authorityUrl =
    tl.getEndpointDataParameter(serviceConnection, "activeDirectoryAuthority", true) ??
    "https://login.microsoftonline.com/";

  tl.debug(`Getting federated token for service connection ${serviceConnection}`);
  var federatedToken: string = await getFederatedToken(serviceConnection);
  tl.debug(`Got federated token for service connection ${serviceConnection}`);

  // Exchange federated token for service principal token
  return await getAccessTokenFromFederatedToken(servicePrincipalId, tenantId, federatedToken, authorityUrl);
}

async function getAccessTokenFromFederatedToken(
    servicePrincipalId: string,
    tenantId: string,
    federatedToken: string,
    authorityUrl: string
  ): Promise<string> {
    const AzureDevOpsResourceId = "499b84ac-1321-427f-aa17-267ca6975798";
    tl.debug(`Using authority url: ${authorityUrl}`);
    tl.debug(`Using resource: ${AzureDevOpsResourceId}`);

    const config: msal.Configuration = {
      auth: {
        clientId: servicePrincipalId,
        authority: `${authorityUrl.replace(/\/+$/, "")}/${tenantId}`,
        clientAssertion: federatedToken,
      },
      system: {
        loggerOptions: {
          loggerCallback: (_level, message, _containsPii) => {
            tl.debug(message);
          },
          piiLoggingEnabled: false,
          logLevel: msal.LogLevel.Verbose,
        },
      },
    };

    const app = new msal.ConfidentialClientApplication(config);

    const request: msal.ClientCredentialRequest = {
      scopes: [`${AzureDevOpsResourceId}/.default`],
      skipCache: true,
    };

    const result = await app.acquireTokenByClientCredential(request);
    if (!result?.accessToken) {
        tl.debug("MSAL did not return an access token.");
    }
    if(result?.expiresOn) {
        const minutesUntilExpiration = (result.expiresOn.getTime() - Date.now()) / 60000;
        console.log(`Generated access token with expiration time of ${minutesUntilExpiration} minutes.`);
    }

    return result?.accessToken;
}
