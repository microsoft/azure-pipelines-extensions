using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;

namespace VstsServerTaskHelper.UnitTests
{
    /// <summary>
    /// Unit test class for <see cref="GitClient"/> class.
    /// </summary>
    [TestClass]
    public class GitClientTests
    {
        private readonly VssBasicCredential credentials;
        private readonly GitClient gitClient;

        public GitClientTests()
        {
            this.credentials = new VssBasicCredential(string.Empty, TestAccountConstants.SecretToken);
            this.gitClient = new GitClient(new Uri(TestAccountConstants.AccountUri), this.credentials);
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
