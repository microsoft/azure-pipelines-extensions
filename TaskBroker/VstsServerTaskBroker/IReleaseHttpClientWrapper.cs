using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi;
using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi.Contracts;

namespace VstsServerTaskBroker
{
    public interface IReleaseHttpClientWrapper
    {
        Task<List<AgentArtifactDefinition>> GetAgentArtifactDefinitionsAsync(Guid projectId, int releaseId, CancellationToken cancellationToken);

        Task<Release> GetReleaseAsync(Guid projectId, int releaseId, CancellationToken cancellationToken);
    }
}