using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.TestTools.UnitTesting;

using VstsServerTaskBroker.Contracts;

using TaskResult = Microsoft.TeamFoundation.DistributedTask.WebApi.TaskResult;

namespace VstsServerTaskBroker.UnitTest
{
    /// <summary>
    /// Unit test class for <see cref="ReportingBrokerJobCompletedTests"/> class.
    /// </summary>
    [TestClass]
    public class ReportingBrokerJobCompletedTests
    {
        [TestMethod]
        public async Task ReportsPassedTest()
        {
            // given
            var returnNullBuild = false;
            var buildStatus = BuildStatus.None;
            var isPassed = true;

            // then
            var expectedEventCount = 1;
            var expectedResult = TaskResult.Succeeded;

            // when
            await TestReportJobCompleted(buildStatus, returnNullBuild, isPassed, expectedEventCount, expectedResult);
        }

        [TestMethod]
        public async Task ReportsFailedTest()
        {
            // given
            var returnNullBuild = false;
            var buildStatus = BuildStatus.None;
            var isPassed = false;

            // then
            var expectedEventCount = 1;
            var expectedResult = TaskResult.Failed;

            // when
            await TestReportJobCompleted(buildStatus, returnNullBuild, isPassed, expectedEventCount, expectedResult);
        }

        [TestMethod]
        public async Task SkipsNullBuildTest()
        {
            // given
            var returnNullBuild = true;
            var buildStatus = BuildStatus.None;
            var isPassed = false;

            // then
            var expectedEventCount = 0;
            var expectedResult = TaskResult.Abandoned;

            // when
            await TestReportJobCompleted(buildStatus, returnNullBuild, isPassed, expectedEventCount, expectedResult);
        }

        [TestMethod]
        public async Task SkipsCompletedBuildTest()
        {
            // given
            var returnNullBuild = false;
            var buildStatus = BuildStatus.Completed;
            var isPassed = false;

            // then
            var expectedEventCount = 0;
            var expectedResult = TaskResult.Abandoned;

            // when
            await TestReportJobCompleted(buildStatus, returnNullBuild, isPassed, expectedEventCount, expectedResult);
        }

        [TestMethod]
        public async Task TestReportJobStarted(BuildStatus buildStatus, bool returnNullBuild, int expectedEventCount, TaskResult expectedResult)
        {
            // given
            VstsMessageBase vstsContext = new TestVstsMessage()
            {
                VstsUri = new Uri("http://vstsUri"),
                VstsPlanUri = new Uri("http://vstsPlanUri"),
            };
            var mockBuildClient = new MockBuildClient()
            {
                MockBuild = new Build() { Status = buildStatus },
                ReturnNullBuild = returnNullBuild,
            };
            var mockTaskHttpClient = new MockTaskHttpClient();
            var reportingHelper = new VstsReportingHelper(vstsContext, new TraceBrokerInstrumentation(), new Dictionary<string, string>())
            {
                CreateBuildClient = (uri, s) => ReturnMockBuildClientIfUrlValid(uri, vstsContext, mockBuildClient),
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

        [TestMethod]
        public async Task TestReportJobCompleted(BuildStatus buildStatus, bool returnNullBuild, bool isPassed, int expectedEventCount, TaskResult expectedResult)
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
                MockBuild = new Build() {Status = buildStatus},
                ReturnNullBuild = returnNullBuild,
            };
            var mockTaskHttpClient = new MockTaskHttpClient();
            var reportingHelper = new VstsReportingHelper(vstsContext, new TraceBrokerInstrumentation(), new Dictionary<string, string>())
            {
                CreateBuildClient = (uri, s) => ReturnMockBuildClientIfUrlValid(uri, vstsContext, mockBuildClient),
                CreateTaskHttpClient = (uri, s, i, r) => mockTaskHttpClient
            };

            // when
            await reportingHelper.ReportJobCompleted(DateTime.UtcNow,  "test message", isPassed, default(CancellationToken));

            // then
            Assert.AreEqual(expectedEventCount, mockTaskHttpClient.EventsReceived.Count);
            if (expectedEventCount != 0)
            {
                var taskEvent = mockTaskHttpClient.EventsReceived[0] as JobCompletedEvent;
                Assert.IsNotNull(taskEvent);
                Assert.AreEqual(taskEvent.Result, expectedResult);
            }
        }

        internal static MockBuildClient ReturnMockBuildClientIfUrlValid(Uri uri, VstsMessageBase vstsMessage, MockBuildClient mockBuildClient)
        {
            Assert.IsNotNull(uri, "require uri to validate correct one is used");
            Assert.AreNotEqual(vstsMessage.VstsUri, vstsMessage.VstsPlanUri, "need to be different to ensure we can test correct one is used");
            Assert.AreEqual(vstsMessage.VstsUri, uri, "wrong url passed to create bulid client");
            return mockBuildClient;
        }
    }
}
