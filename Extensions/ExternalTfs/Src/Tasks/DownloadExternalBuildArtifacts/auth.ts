import tl = require('azure-pipelines-task-lib/task');
import * as msal from "@azure/msal-node";
import { getFederatedToken } from "azure-pipelines-tasks-azure-arm-rest/azCliUtility";

const workloadIdentityFederation = "workloadidentityfederation";

export async function getAccessTokenViaWorkloadIdentityFederation(connectedService: string): Promise<string> {
  const authorizationScheme = tl
    .getEndpointAuthorizationSchemeRequired(connectedService)
    .toLowerCase();

  if (authorizationScheme !== workloadIdentityFederation) {
    throw new Error(`Authorization scheme ${authorizationScheme} is not supported.`);
  }

  const servicePrincipalId: string =
    tl.getEndpointAuthorizationParameterRequired(connectedService, "serviceprincipalid");

  const servicePrincipalTenantId: string =
    tl.getEndpointAuthorizationParameterRequired(connectedService, "tenantid");

  const authorityUrl =
    tl.getEndpointDataParameter(connectedService, "activeDirectoryAuthority", true) ?? "https://login.microsoftonline.com/";

  tl.debug(`Getting federated token for service connection ${connectedService}`);
  let federatedToken: string;
  try {
    federatedToken = await getFederatedToken(connectedService);
  } catch (err) {
    tl.error(`Failed to get federated token: ${err instanceof Error ? err.message : err}`);
    throw err;
  }

  if (!federatedToken || federatedToken.length === 0) {
    throw new Error(`Federated token is empty for service connection ${connectedService}`);
  }

  tl.debug(`Got federated token (length=${federatedToken.length}) for service connection ${connectedService}`);

  try {
    const parts = federatedToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      tl.debug(`Federated token payload iss=${payload.iss} sub=${payload.sub} aud=${payload.aud}`);
    } else {
      tl.debug(`Federated token not standard JWT parts=${parts.length}`);
    }
  } catch {
    tl.debug('Failed to parse federated token payload');
  }

  return await getAccessTokenFromFederatedToken(servicePrincipalId, servicePrincipalTenantId, federatedToken, authorityUrl);
}

async function getAccessTokenFromFederatedToken(
  servicePrincipalId: string,
  servicePrincipalTenantId: string,
  federatedToken: string,
  authorityUrl: string
): Promise<string> {
  const AzureDevOpsResourceId = "499b84ac-1321-427f-aa17-267ca6975798";

  tl.debug(`Using authority url: ${authorityUrl}`);
  tl.debug(`Using resource: ${AzureDevOpsResourceId}`);

  const config: msal.Configuration = {
    auth: {
      clientId: servicePrincipalId,
      authority: `${authorityUrl.replace(/\/+$/, "")}/${servicePrincipalTenantId}`,
      clientAssertion: async () => federatedToken
    },
    system: {
      loggerOptions: {
        loggerCallback: (_level, message) => tl.debug(message),
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose
      }
    }
  };

  tl.debug(`msal-node runtime version: ${require('@azure/msal-node/package.json').version}`);
  tl.debug(`Authority final: ${config.auth.authority}`);
  tl.debug(`Federated token length: ${federatedToken.length}`);

  let app: msal.ConfidentialClientApplication;
  try {
    app = new msal.ConfidentialClientApplication(config);
  } catch (e) {
    tl.error(`Failed to construct ConfidentialClientApplication: ${e instanceof Error ? e.message : e}`);
    throw e;
  }

  const request: msal.ClientCredentialRequest = {
    scopes: [`${AzureDevOpsResourceId}/.default`],
    skipCache: true
  };

  let result: msal.AuthenticationResult;
  try {
    result = await app.acquireTokenByClientCredential(request);
  } catch (e) {
    const err = e as Error;
    tl.error(`acquireTokenByClientCredential failed: ${err.message}`);
    if (err.stack) {
      tl.debug(err.stack);
    }
    throw err;
  }

  if (!result?.accessToken) {
    throw new Error("MSAL did not return an access token.");
  }

  tl.debug(`Got access token for service principal ${servicePrincipalId}`);

  if (result.expiresOn) {
    const minutes = (result.expiresOn.getTime() - Date.now()) / 60000;
    console.log(`Generated access token with expiration time of ${minutes.toFixed(2)} minutes.`);
  }

  return result.accessToken;
}