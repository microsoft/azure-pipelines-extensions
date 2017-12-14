using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.Services.Client;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi;
using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi.Clients;
using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi.Contracts;
using Microsoft.VisualStudio.Services.WebApi;

namespace VstsServerTaskHelper
{
    public class ReleaseClient : IReleaseClient
    {
        private readonly Microsoft.VisualStudio.Services.ReleaseManagement.WebApi.Clients.ReleaseHttpClient client;

        public ReleaseClient(Uri baseUrl, VssCredentials credentials)
        {
            var interactiveCredentials = new VssClientCredentials();
            var vssConnection = new VssConnection(baseUrl, interactiveCredentials);
            this.client = vssConnection.GetClient<ReleaseHttpClient>();
        }

        public async Task<List<AgentArtifactDefinition>> GetAgentArtifactDefinitionsAsync(Guid projectId, int releaseId, CancellationToken cancellationToken)
        {
            var releaseDefs = await this.client.GetAgentArtifactDefinitionsAsync(projectId, releaseId, cancellationToken: cancellationToken).ConfigureAwait(false);

            return releaseDefs;
        }

        public async Task<Release> GetReleaseAsync(Guid projectId, int releaseId, CancellationToken cancellationToken)
        {
            return await this.client.GetReleaseAsync(projectId, releaseId, cancellationToken: cancellationToken);
        }

        public static async Task<bool> IsReleaseValid(IReleaseClient releaseClient, Guid projectId, int releaseId, CancellationToken cancellationToken)
        {
            try
            {
                var release = await releaseClient.GetReleaseAsync(projectId, releaseId, cancellationToken).ConfigureAwait(false);
                if (release != null && release.Status == ReleaseStatus.Active)
                {
                    return true;
                }
            }
            catch (VssServiceException ex)
            {
                if (!ex.Message.Contains("does not exist"))
                {
                    throw;
                }
            }

            return false;
        }
    }
}