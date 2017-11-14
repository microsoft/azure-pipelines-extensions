using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using TaskResult = Microsoft.TeamFoundation.DistributedTask.WebApi.TaskResult;

namespace VstsServerTaskHelper.UnitTests
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
            var expectedRecordCount = 2;

            // when
            await TestReportJobCompleted(buildStatus, returnNullBuild, isPassed, expectedEventCount, expectedResult, expectedRecordCount);
        }

        [TestMethod]
        public async Task ReportsPassedTestWithUpdateOnlyGivenTimelineRecord()
        {
            // given
            var returnNullBuild = false;
            var buildStatus = BuildStatus.None;
            var isPassed = true;

            // then
            var expectedEventCount = 1;
            var expectedResult = TaskResult.Succeeded;
            var expectedRecordCount = 1;

            // when
            string timeLineRecordName = "CloudTest_12345";
            await TestReportJobCompleted(buildStatus, returnNullBuild, isPassed, expectedEventCount, expectedResult, expectedRecordCount, timeLineRecordName);
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
            var expectedRecordCount = 2;

            // when
            await TestReportJobCompleted(buildStatus, returnNullBuild, isPassed, expectedEventCount, expectedResult, expectedRecordCount);
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
        
        private async Task TestReportJobStarted(BuildStatus buildStatus, bool returnNullBuild, int expectedEventCount, TaskResult expectedResult)
        {
            // given
            var vstsContext = new TestVstsMessage()
            {
                VstsUri = new Uri("http://vstsUri"),
                VstsPlanUri = new Uri("http://vstsPlanUri"),
            };
            var mockBuildClient = new MockBuildClient()
            {
                MockBuild = new Build() { Status = buildStatus },
                ReturnNullBuild = returnNullBuild,
            };
            var mockReleaseClient = new MockReleaseClient()
            {
                MockRelease = new Release() { Status = ReleaseStatus.Undefined },
                ReturnNullRelease = false,
            };
            var mockTaskClient = new MockTaskClient();
            var reportingHelper = new VstsReportingHelper(vstsContext, new TraceBrokerInstrumentation(), new Dictionary<string, string>())
            {
                CreateBuildClient = (uri, s) => ReturnMockBuildClientIfUrlValid(uri, vstsContext, mockBuildClient),
                CreateReleaseClient = (uri, s) => mockReleaseClient,
                CreateTaskHttpClient = (uri, s, i, r) => mockTaskClient
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

        private async Task TestReportJobCompleted(BuildStatus buildStatus, bool returnNullBuild, bool isPassed, int expectedEventCount, TaskResult expectedResult, int expectedRecordCount = 0, string timeLineRecordName = null)
        {
            // given
            Guid parentId = Guid.NewGuid();
            Guid childId = Guid.NewGuid();
            VstsMessage vstsContext = new TestVstsMessage
            {
                JobId = parentId,
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
            var mockReleaseClient = new MockReleaseClient()
            {
                MockRelease = new Release() { Status = ReleaseStatus.Undefined },
                ReturnNullRelease = false,
            };

            var timelineRecords = new List<Microsoft.TeamFoundation.DistributedTask.WebApi.TimelineRecord>
            {
                new Microsoft.TeamFoundation.DistributedTask.WebApi.TimelineRecord()
                {
                    Id = parentId
                },
                new Microsoft.TeamFoundation.DistributedTask.WebApi.TimelineRecord()
                {
                    Id = childId,
                    ParentId = parentId
                },
                new Microsoft.TeamFoundation.DistributedTask.WebApi.TimelineRecord()
                {
                    // Should be ignored
                    Id = Guid.NewGuid()
                }
            };

            if (!string.IsNullOrEmpty(timeLineRecordName))
            {
                timelineRecords.Add(new Microsoft.TeamFoundation.DistributedTask.WebApi.TimelineRecord()
                {
                    Id = Guid.NewGuid(),
                    Name = timeLineRecordName
                });
            }

            var mockTaskHttpClient = new MockTaskClient()
            {
                GetRecordsReturnCollection = timelineRecords
            };

            var reportingHelper = new VstsReportingHelper(vstsContext, new TraceBrokerInstrumentation(), new Dictionary<string, string>(), timeLineRecordName)
            {
                CreateBuildClient = (uri, s) => ReturnMockBuildClientIfUrlValid(uri, vstsContext, mockBuildClient),
                CreateReleaseClient = (uri, s) => mockReleaseClient,
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

            Assert.AreEqual(expectedRecordCount, mockTaskHttpClient.TimelineRecordsUpdated.Count);
            if (expectedRecordCount != 0)
            {
                var records = string.IsNullOrEmpty(timeLineRecordName) ?
                    mockTaskHttpClient.TimelineRecordsUpdated.Where(rec => rec.Id == parentId || rec.Id == childId).ToList() :
                        mockTaskHttpClient.TimelineRecordsUpdated.Where(rec => rec.Name != null && rec.Name.Equals(timeLineRecordName, StringComparison.OrdinalIgnoreCase)).ToList();
                Assert.AreEqual(expectedRecordCount, records.Count);

                foreach (var record in records)
                {
                    Assert.IsNotNull(record);
                    Assert.AreEqual(expectedResult, record.Result);
                }
            }
        }

        internal static MockBuildClient ReturnMockBuildClientIfUrlValid(Uri uri, VstsMessage vstsMessage, MockBuildClient mockBuildClient)
        {
            Assert.IsNotNull(uri, "require uri to validate correct one is used");
            Assert.AreNotEqual(vstsMessage.VstsUri, vstsMessage.VstsPlanUri, "need to be different to ensure we can test correct one is used");
            Assert.AreEqual(vstsMessage.VstsUri, uri, "wrong url passed to create bulid client");
            return mockBuildClient;
        }
    }
}
