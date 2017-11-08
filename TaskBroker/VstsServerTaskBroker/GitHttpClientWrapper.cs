using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.Policy.WebApi;
using Microsoft.TeamFoundation.SourceControl.WebApi;
using Microsoft.VisualStudio.Services.Common;

namespace VstsServerTaskBroker
{
    public class GitHttpClientWrapper : IGitHttpClientWrapper
    {
        private readonly GitHttpClient client;
        private readonly PolicyHttpClient policyClient;

        public GitHttpClientWrapper(Uri baseUrl, VssCredentials credentials)
        {
            this.client = new GitHttpClient(baseUrl, credentials);
            this.policyClient = new PolicyHttpClient(baseUrl, credentials);
        }

        public async Task<GitPullRequest> GetPullRequestAsync(Guid projectId, string repositoryName, int pullRequestId, CancellationToken cancellationToken)
        {
            var pullRequest = await this.client.GetPullRequestAsync(projectId, repositoryName, pullRequestId, cancellationToken: cancellationToken).ConfigureAwait(false);

            return pullRequest;
        }

        public async Task<IEnumerable<PolicyEvaluationRecord>> GetPolicyEvaluations(Guid projectId, int pullRequestId, CancellationToken cancellationToken)
        {
            var artifactId = string.Format("vstfs:///CodeReview/CodeReviewId/{0}%2F{1}", projectId, pullRequestId);
            var policyEvaluationRecords = await this.policyClient.GetPolicyEvaluationsAsync(projectId, artifactId, cancellationToken: cancellationToken).ConfigureAwait(false);

            return policyEvaluationRecords;
        }
    }
}
