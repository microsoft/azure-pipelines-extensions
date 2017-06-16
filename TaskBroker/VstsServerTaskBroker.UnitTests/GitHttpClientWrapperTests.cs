using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.TestTools.UnitTesting;

using Newtonsoft.Json;

namespace VstsServerTaskBroker.UnitTest
{
    /// <summary>
    /// Unit test class for <see cref="GitHttpClientWrapper"/> class.
    /// </summary>
    [TestClass]
    public class GitHttpClientWrapperTests
    {
        private readonly VssBasicCredential credentials;
        private readonly GitHttpClientWrapper gitClient;

        public GitHttpClientWrapperTests()
        {
            this.credentials = new VssBasicCredential(string.Empty, TestAccountConstants.SecretToken);
            this.gitClient = new GitHttpClientWrapper(new Uri(TestAccountConstants.AccountUri), this.credentials);
        }

        [Ignore]
        [TestMethod]
        public async Task GetPolicyEvaluationsTest()
        {
            var pullRequestId = 133902;
            var evaluationRecords = await this.gitClient.GetPolicyEvaluations(TestAccountConstants.ProjectId, pullRequestId, CancellationToken.None);
            Assert.IsNotNull(evaluationRecords);
            Trace.WriteLine(JsonConvert.SerializeObject(evaluationRecords, Formatting.Indented));
        }
    }
}
