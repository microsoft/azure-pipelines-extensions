using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskBroker
{
    public interface IArtifactsHelper
    {
        /// <summary>
        /// This returns the build drop url for a given build id and drop artifact name. For both VSTS build and release tasks a build drop location is set as part of build artifacts.
        /// </summary>
        /// <param name="dropArtifactsName">Name of the build artifact associated with the build or release.</param>
        /// <param name="buildId">VSTS Build Id.</param>
        /// <param name="cancellationToken">Cancellaiton token.</param>
        /// <returns>Drop url otherwise returns the failure reason.</returns>
        Task<VstsArtifactsHelper.ArtifactsDropResult> TryGetDropUrlFromBuildArtifact(string dropArtifactsName, int buildId, CancellationToken cancellationToken);

        /// <summary>
        /// This returns the build drop url (ArtifactsDropResult) or unc drop path (ArtifactsUncResult) based on the artifact type (will throw for other types).
        /// </summary>
        /// <param name="dropArtifactsName">Name of the build artifact associated with the build or release.</param>
        /// <param name="buildId">VSTS Build Id.</param>
        /// <param name="cancellationToken">Cancellaiton token.</param>
        /// <returns>Drop url otherwise returns the failure reason.</returns>
        Task<VstsArtifactsHelper.ArtifactsResult> TryGetDropUrlOrUncFromBuildArtifact(string dropArtifactsName, int buildId, CancellationToken cancellationToken);

        /// <summary>
        /// This is used only for VSTS build task to get the build id associated with the same pull request.
        /// </summary>
        /// <param name="sourceBranch">Source branch of the build.</param>
        /// <param name="buildDefName">Name of the build definition.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A VSTS build id if found otherwise returns the failure reason.</returns>
        Task<VstsArtifactsHelper.ArtifactsBuildResult> TryGetArtifactBuildIdFromPullRequestMergeBranch(string sourceBranch, string buildDefName, CancellationToken cancellationToken);

        /// <summary>
        /// This is used only for VSTS release task to get the build id assocaited with the release artifact definition.
        /// </summary>
        /// <param name="releaseId">VSTS Release Id.</param>
        /// <param name="artifactSourceAlias">Artifact source alias for the drop.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A VSTS build id otherwise the failure reason.</returns>
        Task<VstsArtifactsHelper.ArtifactsBuildResult> TryGetArtifactBuildIdFromRelease(int releaseId, string artifactSourceAlias, CancellationToken cancellationToken);
    }
}