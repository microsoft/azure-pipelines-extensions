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
    /// Unit test class for <see cref="BuildHttpClientWrapper"/> class.
    /// </summary>
    [TestClass]
    public class BuildClientWrapperTests
    {
        private readonly VssBasicCredential credentials;
        private readonly BuildHttpClientWrapper buildHttpClientWrapper;

        public BuildClientWrapperTests()
        {
            this.credentials = new VssBasicCredential(string.Empty, TestAccountConstants.SecretToken);
            this.buildHttpClientWrapper = new BuildHttpClientWrapper(new Uri(TestAccountConstants.AccountUri), this.credentials);
        }

        [Ignore]
        [TestMethod]
        public async Task GetBuildDefinitionAsyncTest()
        {
            var buildName = "DumbBuild";
            var buildDefinitionReference = await this.buildHttpClientWrapper.GetBuildDefinitionAsync(TestAccountConstants.ProjectId, buildName, CancellationToken.None);
            Assert.IsNotNull(buildDefinitionReference);
            Trace.WriteLine(JsonConvert.SerializeObject(buildDefinitionReference, Formatting.Indented));
        }
    }
}
