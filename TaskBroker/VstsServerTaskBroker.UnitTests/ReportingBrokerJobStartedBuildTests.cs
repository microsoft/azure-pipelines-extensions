using System;
using System.Collections.Generic;
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
            VstsMessageBase vstsContext = new TestVstsMessage
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
            var mockTaskHttpClient = new MockTaskHttpClient();
            var reportingHelper = new VstsReportingHelper(vstsContext, new TraceBrokerInstrumentation(), new Dictionary<string, string>())
            {
                CreateBuildClient = (uri, s) => ReportingBrokerJobCompletedTests.ReturnMockBuildClientIfUrlValid(uri, vstsContext, mockBuildClient),
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
    }
}
