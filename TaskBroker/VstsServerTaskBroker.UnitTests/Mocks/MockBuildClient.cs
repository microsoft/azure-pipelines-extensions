using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.Build.WebApi;

namespace VstsServerTaskHelper
{
    public class MockBuildClient : IBuildClient
    {
        public Stream ContentStream { get; set; }

        public Build MockBuild { get; set; }

        public bool ReturnNullBuild { get; set; }

        public BuildArtifact MockBuildArtifact { get; set; }

        public Task<Build> GetBuildAsync(Guid projectId, int buildId, CancellationToken cancellationToken)
        {
            if (this.ReturnNullBuild)
            {
                return Task.FromResult<Build>(null);
            }

            if (this.MockBuild != null)
            {
                return Task.FromResult(this.MockBuild);
            }

            throw new NotImplementedException();
        }

        public Task<Build> GetLatestBuildWithTagAsync(Guid projectId, int definitionId, string tag)
        {
            throw new NotImplementedException();
        }

        public Task<BuildDefinitionReference> GetBuildDefinitionAsync(Guid projectId, string buildName, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public Task<Stream> GetArtifactContentZipAsync(Guid projectId, int buildId, string artifactName, CancellationToken cancellationToken)
        {
            if (this.ContentStream != null)
            {
                return Task.FromResult(ContentStream);
            }

            throw new NotImplementedException();
        }

        public Task<BuildArtifact> GetArtifactAsync(Guid projectId, int buildId, string artifactName, CancellationToken cancellationToken)
        {
            if (this.MockBuildArtifact != null)
            {
                return Task.FromResult(this.MockBuildArtifact);
            }

            throw new NotImplementedException();
        }
    }
}