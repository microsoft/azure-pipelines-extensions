using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.VisualStudio.Services.Common;

namespace VstsServerTaskBroker
{
    public class MockBuildClient : IBuildHttpClientWrapper
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

    public class BuildHttpClientWrapper : IBuildHttpClientWrapper
    {
        private const int RetryCount = 3;
        private const int RetryIntervalInSeconds = 5;

        private readonly BuildHttpClient client;
        private readonly VstsTaskHttpRetryer retryer;

        public BuildHttpClientWrapper(Uri baseUrl, VssCredentials credentials)
        {
            this.client = new BuildHttpClient(baseUrl, credentials);
            this.retryer = VstsTaskHttpRetryer.CreateRetryer(RetryCount, TimeSpan.FromSeconds(RetryIntervalInSeconds));
        }

        public async Task<Build> GetBuildAsync(Guid projectId, int buildId, CancellationToken cancellationToken)
        {
            return await this.retryer.TryActionAsync(
                async () =>
                {
                    Build build;

                    try
                    {
                        build = await this.client.GetBuildAsync(projectId, buildId, cancellationToken: cancellationToken).ConfigureAwait(false);
                    }
                    catch (BuildNotFoundException)
                    {
                        return null;
                    }

                    return build;
                });
        }

        public async Task<BuildDefinitionReference> GetBuildDefinitionAsync(Guid projectId, string buildName, CancellationToken cancellationToken)
        {
            return await this.retryer.TryActionAsync(
                async () =>
                {
                    var buildDefs = await this.client.GetDefinitionsAsync(projectId, name: buildName, cancellationToken: cancellationToken).ConfigureAwait(false);

                    return buildDefs.FirstOrDefault();
                });
        }

        public async Task<Stream> GetArtifactContentZipAsync(Guid projectId, int buildId, string artifactName, CancellationToken cancellationToken)
        {
            return await this.client.GetArtifactContentZipAsync(projectId, buildId, artifactName, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);
        }

        public async Task<BuildArtifact> GetArtifactAsync(Guid projectId, int buildId, string artifactName, CancellationToken cancellationToken)
        {
            var artifact = await this.client.GetArtifactAsync(projectId, buildId, artifactName, null, cancellationToken);
            
            // if you give a bad artifact name then you can get a artifact with a null resource it seems?
            if (artifact == null || artifact.Resource == null)
            {
                return null;
            }
            
            return artifact;
        }

        public static async Task<bool> IsBuildValid(IBuildHttpClientWrapper buildClient, Guid projectId, int buildId, CancellationToken cancellationToken)
        {
            try
            {
                var build = await buildClient.GetBuildAsync(projectId, buildId, cancellationToken).ConfigureAwait(false);
                if (build != null && build.Status.HasValue && build.Status.Value != BuildStatus.Cancelling && build.Status.Value != BuildStatus.Completed && build.Status.Value != BuildStatus.Postponed)
                {
                    return true;
                }
            }
            catch (BuildNotFoundException)
            {
            }

            return false;
        }
    }
}
