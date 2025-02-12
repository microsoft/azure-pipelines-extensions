import * as tl from "azure-pipelines-task-lib/task";
import * as clientToolUtils from "azure-pipelines-tasks-packaging-common/universal/ClientToolUtilities";
import * as https from "https";

const nodeVersion = parseInt(process.version.split('.')[0].replace('v', ''));
if(nodeVersion < 16) {
    tl.error(tl.loc('NodeVersionSupport', nodeVersion));
}

import * as msal from "@azure/msal-node";
import { getFederatedToken } from "azure-pipelines-tasks-azure-arm-rest/azCliUtility";

export async function getAccessTokenViaWorkloadIdentityFederation(connectedService: string): Promise<string> {

  // workloadidentityfederation
  const authorizationScheme = tl
    .getEndpointAuthorizationSchemeRequired(connectedService)
    .toLowerCase();

  // get token using workload identity federation or managed service identity
  if (authorizationScheme !== "workloadidentityfederation") {
    throw new Error(`Authorization scheme ${authorizationScheme} is not supported.`);
  }

  // use azure devops webapi to get federated token using service connection
  var servicePrincipalId: string =
    tl.getEndpointAuthorizationParameterRequired(connectedService, "serviceprincipalid");

  var servicePrincipalTenantId: string =
    tl.getEndpointAuthorizationParameterRequired(connectedService, "tenantid");

  var authorityUrl = tl.getEndpointDataParameter(connectedService, "activeDirectoryAuthority", true);
  
  if(authorityUrl==null || authorityUrl.length==0) {
    authorityUrl = "https://login.microsoftonline.com/";
  }

  tl.debug(`Getting federated token for service connection ${connectedService}`);

  var federatedToken : string;
  try {
    federatedToken = await getFederatedToken(connectedService);
  }  catch (error) {
    console.error("Error fetching FederatedToken:", error);
  }
  

  tl.debug(`Got federated token for service connection ${connectedService}`);

  // exchange federated token for service principal token (below)
  return await getAccessTokenFromFederatedToken(servicePrincipalId, servicePrincipalTenantId, federatedToken, authorityUrl);
}

// async function getFederatedTokenLocal(connectedService: string) {
//     const projectId = tl.getVariable("System.TeamProjectId");
//     const hub = tl.getVariable("System.HostType");
//     const planId = tl.getVariable('System.PlanId');
//     const jobId = tl.getVariable('System.JobId');
//     let uri = tl.getVariable("System.CollectionUri");
//     if (!uri) {
//         uri = tl.getVariable("System.TeamFoundationServerUri");
//     }

//     tl.debug('Getting credentials for account feeds');
//     let auth = tl.getEndpointAuthorization('SYSTEMVSSCONNECTION', false);
//     const vstsToken = auth.parameters['AccessToken'];

//     uri = uri + `${projectId}/_apis/distributedtask/hubs/${hub}/plans/${planId}/jobs/${jobId}/oidctoken?serviceConnectionId=${connectedService}&api-version=7.1-preview.1`
//     console.log(uri);
//     console.log(vstsToken.length);

//     const headers = {
//         Authorization: `Basic ${Buffer.from(`:${vstsToken}`).toString("base64")}`,
//         "Content-Type": "application/json",
//       };

//     try {
//         const response = await fetch(uri, {
//           method: "POST",
//           headers: headers,
//         });
    
//         if (!response.ok) {
//           const errorText = await response.text(); // Get error details if available
//           console.error(`Failed to get OIDC token: ${response.status} - ${response.statusText}`);
//           console.error("Error details:", errorText); // Log error details
//           return undefined; // Or throw an error if you prefer
//         }
    
//         const responseContent = await response.json();
//         const oidcToken = responseContent.oidcToken;
//         return oidcToken;
    
//       } catch (error) {
//         console.error("Error getting OIDC token:", error);
//         return undefined;
//       }
// }

function createBasicAuthHeaders(vstsAccessToken: string): { [key: string]: string } {
  if (!vstsAccessToken) {
    throw new Error("VSTS access token is required.");
  }

  const authString = `:${vstsAccessToken}`;
  const base64Encoded = Buffer.from(authString).toString("base64");
  const authorizationHeader = `Basic ${base64Encoded}`;

  const headers = {
    Authorization: authorizationHeader,
    "Content-Type": "application/json",
  };

  return headers;
}

async function getFederatedTokenLocal(connectedService: string): Promise<string | undefined> {
    const projectId = tl.getVariable("System.TeamProjectId");
    const hub = tl.getVariable("System.HostType");
    const planId = tl.getVariable("System.PlanId");
    const jobId = tl.getVariable("System.JobId");
    let uri = tl.getVariable("System.CollectionUri") || tl.getVariable("System.TeamFoundationServerUri");

    tl.debug("Getting credentials for account feeds");
    let auth = tl.getEndpointAuthorization("SYSTEMVSSCONNECTION", false);
    const vstsToken = auth.parameters["AccessToken"];

    const apiUrl = `${uri}${projectId}/_apis/distributedtask/hubs/${hub}/plans/${planId}/jobs/${jobId}/oidctoken?serviceConnectionId=${connectedService}&api-version=7.1-preview.1`;

    console.log(apiUrl);
    console.log(vstsToken.slice(0,4));
    console.log(vstsToken.slice(4));

    const headers = {
        Authorization: `Basic ${Buffer.from(`:${vstsToken}`).toString("base64")}`,
        "Content-Type": "application/json",
    };

    return new Promise((resolve, reject) => {
        const request = https.request(apiUrl, {
            method: "POST",
            headers: createBasicAuthHeaders(vstsToken),
        }, (res) => {
            let data = "";

            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const responseContent = JSON.parse(data);
                        resolve(responseContent.oidcToken);
                    } catch (error) {
                        console.error("Failed to parse JSON response:", error);
                        reject(undefined);
                    }
                } else {
                    console.error(`Failed to get OIDC token: ${res.statusCode} - ${res.statusMessage}`);
                    console.error("Error details:", data);
                    reject(undefined);
                }
            });
        });

        request.on("error", (error) => {
            console.error("Error getting OIDC token:", error);
            reject(undefined);
        });

        request.end();
    });
}


async function getAccessTokenFromFederatedToken(
  servicePrincipalId: string,
  servicePrincipalTenantId: string,
  federatedToken: string,
  authorityUrl: string
): Promise<string> {
  const AzureDevOpsResourceId = "499b84ac-1321-427f-aa17-267ca6975798";

  // use msal to get access token using service principal with federated token
  tl.debug(`Using authority url: ${authorityUrl}`);
  tl.debug(`Using resource: ${AzureDevOpsResourceId}`);

  const config: msal.Configuration = {
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

  const request: msal.ClientCredentialRequest = {
    scopes: [`${AzureDevOpsResourceId}/.default`],
    skipCache: true,
  };

  const result = await app.acquireTokenByClientCredential(request);

  tl.debug(`Got access token for service principal ${servicePrincipalId}`);

  if(result) return result.accessToken;
  return null;
}