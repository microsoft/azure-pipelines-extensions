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
    /// Unit test class for <see cref="BuildClient"/> class.
    /// </summary>
    [TestClass]
    public class BuildClientTests
    {
        private readonly VssBasicCredential credentials;
        private readonly BuildClient buildClient;

        public BuildClientTests()
        {
            this.credentials = new VssBasicCredential(string.Empty, TestAccountConstants.SecretToken);
            this.buildClient = new BuildClient(new Uri(TestAccountConstants.AccountUri), this.credentials);
        }

        [Ignore]
        [TestMethod]
        public async Task GetBuildDefinitionAsyncTest()
        {
            var buildName = "DumbBuild";
            var buildDefinitionReference = await this.buildClient.GetBuildDefinitionAsync(TestAccountConstants.ProjectId, buildName, CancellationToken.None);
            Assert.IsNotNull(buildDefinitionReference);
            Trace.WriteLine(JsonConvert.SerializeObject(buildDefinitionReference, Formatting.Indented));
        }
    }
}
