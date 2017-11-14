using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi;
using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi.Contracts;

namespace VstsServerTaskHelper
{
    public class MockReleaseClient : IReleaseHttpClientWrapper
    {
        public List<AgentArtifactDefinition> MockArtifactDefinitions { get; set; }

        public Release MockRelease { get; set; }

        public bool ReturnNullRelease { get; set; }

        public Task<List<AgentArtifactDefinition>> GetAgentArtifactDefinitionsAsync(Guid projectId, int releaseId, CancellationToken cancellationToken)
        {
            if (this.MockArtifactDefinitions != null)
            {
                return Task.FromResult(this.MockArtifactDefinitions );
            }

            throw new NotImplementedException();
        }

        public Task<Release> GetReleaseAsync(Guid projectId, int releaseId, CancellationToken cancellationToken)
        {
            if (this.ReturnNullRelease)
            {
                return Task.FromResult<Release>(null);
            }

            if (this.MockRelease != null)
            {
                return Task.FromResult(this.MockRelease);
            }

            throw new NotImplementedException();
        }
    }
}