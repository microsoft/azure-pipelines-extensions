using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.Build.WebApi;

namespace VstsServerTaskBroker
{
    public interface IBuildHttpClientWrapper
    {
        Task<Build> GetBuildAsync(Guid projectId, int buildId, CancellationToken cancellationToken);

        Task<BuildDefinitionReference> GetBuildDefinitionAsync(Guid projectId, string buildName, CancellationToken cancellationToken);

        Task<Stream> GetArtifactContentZipAsync(Guid projectId, int buildId, string artifactName, CancellationToken cancellationToken);

        Task<BuildArtifact> GetArtifactAsync(Guid projectId, int buildId, string artifactName, CancellationToken cancellationToken);
    }
}