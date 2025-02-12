import * as msal from "@azure/msal-node";
import { getFederatedToken } from "azure-pipelines-tasks-azure-arm-rest/azCliUtility";

export function getAccessTokenViaWorkloadIdentityFederation(connectedService: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // workloadidentityfederation
            const authorizationScheme = tl
                .getEndpointAuthorizationSchemeRequired(connectedService)
                .toLowerCase();

            if (authorizationScheme !== "workloadidentityfederation") {
                return reject(new Error(`Authorization scheme ${authorizationScheme} is not supported.`));
            }

            const servicePrincipalId = tl.getEndpointAuthorizationParameterRequired(
                connectedService,
                "serviceprincipalid"
            );

            const servicePrincipalTenantId = tl.getEndpointAuthorizationParameterRequired(
                connectedService,
                "tenantid"
            );

            const authorityUrl =
                tl.getEndpointDataParameter(connectedService, "activeDirectoryAuthority", true) ?? "https://login.microsoftonline.com/";

            tl.debug(`Getting federated token for service connection ${connectedService}`);

            getFederatedToken(connectedService)
                .then((federatedToken) => {
                    tl.debug(`Got federated token for service connection ${connectedService}`);
                    return getAccessTokenFromFederatedToken(
                        servicePrincipalId,
                        servicePrincipalTenantId,
                        federatedToken,
                        authorityUrl
                    );
                })
                .then((accessToken) => {
                    resolve(accessToken);
                })
                .catch((error) => {
                    reject(error);
                });
        } catch (error) {
            reject(error);
        }
    });
}

function getAccessTokenFromFederatedToken(
    servicePrincipalId: string,
    servicePrincipalTenantId: string,
    federatedToken: string,
    authorityUrl: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        const AzureDevOpsResourceId = "499b84ac-1321-427f-aa17-267ca6975798";

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

        app.acquireTokenByClientCredential(request)
            .then((result) => {
                tl.debug(`Got access token for service principal ${servicePrincipalId}`);
                resolve(result?.accessToken);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
