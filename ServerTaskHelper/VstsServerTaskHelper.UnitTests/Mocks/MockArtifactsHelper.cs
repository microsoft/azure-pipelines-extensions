using System;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper
{
    public class MockArtifactsHelper : IArtifactsHelper
    {
        public Task<VstsArtifactsHelper.ArtifactsDropResult> TryGetDropUrlFromBuildArtifact(string dropArtifactsName, int buildId, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public Task<VstsArtifactsHelper.ArtifactsBuildResult> TryGetArtifactBuildIdFromPullRequestMergeBranch(string sourceBranch, string buildDefName, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public Task<VstsArtifactsHelper.ArtifactsBuildResult> TryGetArtifactBuildIdFromRelease(int releaseId, string artifactSourceAlias, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public Task<VstsArtifactsHelper.ArtifactsResult> TryGetDropUrlOrUncFromBuildArtifact(string dropArtifactsName, int buildId, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}