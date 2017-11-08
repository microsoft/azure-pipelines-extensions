using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.Policy.WebApi;
using Microsoft.TeamFoundation.SourceControl.WebApi;

namespace VstsServerTaskBroker
{
    public class MockGitHttpClientWrapper : IGitHttpClientWrapper
    {
        public Task<GitPullRequest> GetPullRequestAsync(Guid projectId, string repositoryName, int pullRequestId, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<PolicyEvaluationRecord>> GetPolicyEvaluations(Guid projectId, int pullRequestId, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}