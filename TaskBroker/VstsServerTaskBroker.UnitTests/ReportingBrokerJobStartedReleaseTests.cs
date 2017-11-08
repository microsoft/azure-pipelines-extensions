using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi;
using Microsoft.VisualStudio.TestTools.UnitTesting;

using VstsServerTaskBroker.Contracts;

using TaskResult = Microsoft.TeamFoundation.DistributedTask.WebApi.TaskResult;

namespace VstsServerTaskBroker.UnitTest
{
    /// <summary>
    /// Unit test class for <see cref="ReportingBrokerJobStartedReleaseTests"/> class.
    /// </summary>
    [TestClass]
    public class ReportingBrokerJobStartedReleaseTests
    {
        [TestMethod]
        public async Task ReportsStartedTest()
        {
            // given
            var returnNullRelease = false;
            var releaseStatus = ReleaseStatus.Active;

            // then
            var expectedEventCount = 1;

            // when
            await TestReportJobStarted(releaseStatus, returnNullRelease, expectedEventCount);
        }

        [TestMethod]
        public async Task SkipsNullReleaseTest()
        {
            // given
            var returnNullRelease = true;
            var releaseStatus = ReleaseStatus.Undefined;

            // then
            var expectedEventCount = 0;

            // when
            await TestReportJobStarted(releaseStatus, returnNullRelease, expectedEventCount);
        }

        [TestMethod]
        public async Task SkipsUndefinedReleaseTest()
        {
            // given
            var returnNullRelease = false;
            var releaseStatus = ReleaseStatus.Undefined;

            // then
            var expectedEventCount = 0;

            // when
            await TestReportJobStarted(releaseStatus, returnNullRelease, expectedEventCount);
        }

        private static async Task TestReportJobStarted(ReleaseStatus releaseStatus, bool returnNullRelease, int expectedEventCount)
        {
            // given
            VstsMessageBase vstsContext = new TestVstsMessage
            {
                VstsHub = HubType.Release,
                VstsUri = new Uri("http://vstsUri"),
                VstsPlanUri = new Uri("http://vstsPlanUri"),
                ReleaseProperties = new VstsReleaseProperties(),
            };

            var mockBuildClient = new MockBuildClient()
            {
                MockBuild = new Build() { Status = BuildStatus.None },
                ReturnNullBuild = false,
            };
            var mockReleaseClient = new MockReleaseClient()
            {
                MockRelease = new Release() { Status = releaseStatus },
                ReturnNullRelease = returnNullRelease,
            };
            var mockTaskHttpClient = new MockTaskHttpClient();
            var reportingHelper = new VstsReportingHelper(vstsContext, new TraceBrokerInstrumentation(), new Dictionary<string, string>())
            {
                CreateReleaseClient = (uri, s) => ReturnMockReleaseClientIfUrlValid(uri, vstsContext, mockReleaseClient),
                CreateBuildClient = (uri, s) => mockBuildClient,
                CreateTaskHttpClient = (uri, s, i, r) => mockTaskHttpClient
            };

            // when
            await reportingHelper.ReportJobStarted(DateTime.UtcNow, "test message", default(CancellationToken));

            // then
            Assert.AreEqual(expectedEventCount, mockTaskHttpClient.EventsReceived.Count);
            if (expectedEventCount != 0)
            {
                var taskEvent = mockTaskHttpClient.EventsReceived[0] as JobStartedEvent;
                Assert.IsNotNull(taskEvent);
            }
        }

        private static MockReleaseClient ReturnMockReleaseClientIfUrlValid(Uri uri, VstsMessageBase vstsMessage, MockReleaseClient mockReleaseClient)
        {
            Assert.IsNotNull(uri, "require uri to validate correct one is used");
            Assert.AreNotEqual(vstsMessage.VstsUri, vstsMessage.VstsPlanUri, "need to be different to ensure we can test correct one is used");
            Assert.AreEqual(vstsMessage.VstsPlanUri, uri, "wrong url passed to create release client");
            return mockReleaseClient;
        }
    }
}
