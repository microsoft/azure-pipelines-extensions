using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace VstsServerTaskHelper.UnitTests
{
    /// <summary>
    /// Unit test class for <see cref="ReportingBrokerJobStartedBuildTests"/> class.
    /// </summary>
    [TestClass]
    public class ReportingBrokerJobStartedBuildTests
    {
        [TestMethod]
        public async Task ReportsStartedTest()
        {
            // given
            var returnNullBuild = false;
            var buildStatus = BuildStatus.None;

            // then
            var expectedEventCount = 1;

            // when
            await TestReportJobStarted(buildStatus, returnNullBuild, expectedEventCount);
        }

        [TestMethod]
        public async Task SkipsNullBuildTest()
        {
            // given
            var returnNullBuild = true;
            var buildStatus = BuildStatus.None;

            // then
            var expectedEventCount = 0;

            // when
            await TestReportJobStarted(buildStatus, returnNullBuild, expectedEventCount);
        }

        [TestMethod]
        public async Task SkipsCompletedBuildTest()
        {
            // given
            var returnNullBuild = false;
            var buildStatus = BuildStatus.Completed;

            // then
            var expectedEventCount = 0;

            // when
            await TestReportJobStarted(buildStatus, returnNullBuild, expectedEventCount);
        }

        private static async Task TestReportJobStarted(BuildStatus buildStatus, bool returnNullBuild, int expectedEventCount)
        {
            // given
            VstsMessage vstsContext = new TestVstsMessage
            {
                VstsHub = HubType.Build,
                VstsUri = new Uri("http://vstsUri"),
                VstsPlanUri = new Uri("http://vstsPlanUri"),
                BuildProperties = new VstsBuildProperties(),
            };

            var mockBuildClient = new MockBuildClient()
            {
                MockBuild = new Build() { Status = buildStatus },
                ReturnNullBuild = returnNullBuild,
            };
            var mockTaskClient = new MockTaskClient();
            var mockReleaseClient = new MockReleaseClient();
            var reportingHelper = new JobStatusReportingHelper(vstsContext, new TraceLogger(), mockTaskClient)
            {
                CreateBuildClient = (uri, s) => ReportingBrokerJobCompletedTests.ReturnMockBuildClientIfUrlValid(uri, vstsContext, mockBuildClient),
                CreateReleaseClient = (uri, t) => mockReleaseClient
            };

            // when
            await reportingHelper.ReportJobStarted(DateTime.UtcNow, "test message", default(CancellationToken));

            // then
            Assert.AreEqual(expectedEventCount, mockTaskClient.EventsReceived.Count);
            if (expectedEventCount != 0)
            {
                var taskEvent = mockTaskClient.EventsReceived[0] as JobStartedEvent;
                Assert.IsNotNull(taskEvent);
            }
        }
    }
}
