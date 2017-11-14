using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.Policy.WebApi;
using Microsoft.TeamFoundation.SourceControl.WebApi;

namespace VstsServerTaskHelper
{
    public interface IGitHttpClientWrapper
    {
        Task<GitPullRequest> GetPullRequestAsync(Guid projectId, string repositoryName, int pullRequestId, CancellationToken cancellationToken);

        Task<IEnumerable<PolicyEvaluationRecord>> GetPolicyEvaluations(Guid projectId, int pullRequestId, CancellationToken cancellationToken);
    }
}