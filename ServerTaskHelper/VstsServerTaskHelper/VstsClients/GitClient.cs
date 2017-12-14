using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.Policy.WebApi;
using Microsoft.TeamFoundation.SourceControl.WebApi;
using Microsoft.VisualStudio.Services.Client;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace VstsServerTaskHelper
{
    public class GitClient : IGitClient
    {
        private readonly Microsoft.TeamFoundation.SourceControl.WebApi.GitHttpClient client;
        private readonly PolicyHttpClient policyClient;

        public GitClient(Uri baseUrl, VssCredentials credentials)
        {
            var interactiveCredentials = new VssClientCredentials();
            var vssConnection = new VssConnection(baseUrl, interactiveCredentials);
            this.client = vssConnection.GetClient<GitHttpClient>();
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
