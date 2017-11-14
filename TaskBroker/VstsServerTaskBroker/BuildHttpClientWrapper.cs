using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.VisualStudio.Services.Common;

namespace VstsServerTaskHelper
{
    public class BuildHttpClientWrapper : IBuildHttpClientWrapper
    {
        private const int DefaultRetryCount = 3;
        private const int DefaultRetryIntervalInSeconds = 5;

        private readonly BuildHttpClient client;
        private readonly Retryer retryer;

        public BuildHttpClientWrapper(Uri baseUrl, VssCredentials credentials)
            : this(baseUrl, credentials, DefaultRetryCount, DefaultRetryIntervalInSeconds)
        {
        }

        public BuildHttpClientWrapper(Uri baseUrl, VssCredentials credentials, int retryCount, int retryInterval)
        {
            this.client = new BuildHttpClient(baseUrl, credentials);
            this.retryer = Retryer.CreateRetryer(retryCount, TimeSpan.FromSeconds(retryInterval));
        }

        public async Task<Build> GetBuildAsync(Guid projectId, int buildId, CancellationToken cancellationToken)
        {
            var retryEventHandler = new RetryEventHandler("Vsts_GetBuildAsync", eventProperties: null, cancellationToken: cancellationToken, brokerInstrumentation: null);

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
                }, 
                retryEventHandler).ConfigureAwait(false);
        }

        public async Task<Build> GetLatestBuildWithTagAsync(Guid projectId, int definitionId, string tag)
        {
            var builds = await this.client.GetBuildsAsync(projectId, new[] { definitionId }, tagFilters: new[] { tag }, top: 1, queryOrder: BuildQueryOrder.FinishTimeDescending).ConfigureAwait(false);

            return builds.FirstOrDefault();
        }

        public async Task<BuildDefinitionReference> GetBuildDefinitionAsync(Guid projectId, string buildName, CancellationToken cancellationToken)
        {
            var retryEventHandler = new RetryEventHandler("Vsts_GetBuildDefinitionAsync", eventProperties: null, cancellationToken: cancellationToken, brokerInstrumentation: null);

            return await this.retryer.TryActionAsync(
                async () =>
                {
                    var buildDefs = await this.client.GetDefinitionsAsync(projectId, name: buildName, cancellationToken: cancellationToken).ConfigureAwait(false);

                    return buildDefs.FirstOrDefault();
                }, 
                retryEventHandler).ConfigureAwait(false);
        }

        public async Task<Stream> GetArtifactContentZipAsync(Guid projectId, int buildId, string artifactName, CancellationToken cancellationToken)
        {
            var retryEventHandler = new RetryEventHandler("Vsts_GetArtifactContentZipAsync", eventProperties: null, cancellationToken: cancellationToken, brokerInstrumentation: null);

            return await retryer.TryActionAsync(
                async () => await this.client.GetArtifactContentZipAsync(projectId, buildId, artifactName, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false),
            retryEventHandler).ConfigureAwait(false);
        }

        public async Task<BuildArtifact> GetArtifactAsync(Guid projectId, int buildId, string artifactName, CancellationToken cancellationToken)
        {
            var retryEventHandler = new RetryEventHandler("Vsts_GetArtifactAsync", eventProperties: null, cancellationToken: cancellationToken, brokerInstrumentation: null);

            var artifact = await retryer.TryActionAsync(
                async () => await this.client.GetArtifactAsync(projectId, buildId, artifactName, null, cancellationToken).ConfigureAwait(false),
            retryEventHandler).ConfigureAwait(false);
            
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
