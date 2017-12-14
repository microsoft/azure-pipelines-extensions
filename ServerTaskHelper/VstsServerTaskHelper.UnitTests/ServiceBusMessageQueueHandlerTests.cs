using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;

namespace VstsServerTaskHelper.UnitTests
{
    using TaskResult = Microsoft.TeamFoundation.DistributedTask.WebApi.TaskResult;

    /// <summary>
    /// Unit test class for <see cref="ServiceBusMessageQueueHandlerTests"/> class.
    /// </summary>
    [TestClass]
    public class ServiceBusMessageQueueHandlerTests
    {
        // TBD functionality to be tested:
        // - broker logs assigned retries to VSTS
        // - broker reports JobCompleted on assign failure
        // - broker retries completion on VSTS api failure
        // - broker logs counters for retries
        // - broker processes messages async
        // - broker delays abandon on failure per config
        ///////

        [TestMethod]
        public async Task ExecuteGoldenPathTestForBuild()
        {
            // given
            var testVstsMessage = CreateValidTestVstsMessage();
            testVstsMessage.BuildProperties.BuildName = "tacos";
            testVstsMessage.TestProperty = "burrito";
            testVstsMessage.CompleteSychronously = false;

            var mockMessage = CreateMockMessage(testVstsMessage);
            var mockTaskClient = new MockTaskClient();
            var executeCalled = false;
            var handler = new MockVstsHandler
            {
                MockExecuteFunc = (vstsMessage) =>
                {
                    Assert.IsNotNull(vstsMessage);
                    Assert.AreEqual("tacos", vstsMessage.BuildProperties.BuildName);
                    Assert.AreEqual("burrito", vstsMessage.TestProperty);
                    executeCalled = true;
                    return Task.FromResult(new VstsScheduleResult() { Message = "(test) execution started", ScheduledId = "someId", ScheduleFailed = false });
                }
            };
            var mockMessageListener = new MockServiceBusQueueMessageListener();

            // when
            await ProcessTestMessage(mockMessage, mockMessageListener, mockTaskClient, handler);

            // then - executed successfully
            Assert.IsTrue(executeCalled);
            Assert.IsTrue(mockMessageListener.IsCompleted);

            // then - job assigned was called
            Assert.AreEqual(1, mockTaskClient.EventsReceived.Count);
            var assignedEvent = mockTaskClient.EventsReceived[0] as JobAssignedEvent;
            Assert.IsNotNull(assignedEvent);
            Assert.AreEqual(testVstsMessage.JobId, assignedEvent.JobId);

            // then - timeline was created
            Assert.AreEqual(1, mockTaskClient.TimelineRecordsUpdated.Count);
            Assert.AreEqual(string.Format("someTimeline_{0}", testVstsMessage.JobId), mockTaskClient.TimelineRecordsUpdated[0].Name);

            // then - logs were written
            Assert.AreEqual(2, mockTaskClient.LogLines.Count);
        }

        [TestMethod]
        public async Task ExecuteGoldenPathTestForRelease()
        {
            // given
            var testVstsMessage = CreateValidTestVstsMessageForRelease();
            testVstsMessage.TestProperty = "burrito";
            testVstsMessage.CompleteSychronously = false;

            var mockMessage = CreateMockMessage(testVstsMessage);
            var mockTaskClient = new MockTaskClient();
            var executeCalled = false;
            var handler = new MockVstsHandler
            {
                MockExecuteFunc = (vstsMessage) =>
                {
                    Assert.IsNotNull(vstsMessage);
                    Assert.AreEqual(123, vstsMessage.ReleaseProperties.ReleaseId);
                    Assert.AreEqual("burrito", vstsMessage.TestProperty);
                    executeCalled = true;
                    return Task.FromResult(new VstsScheduleResult() { Message = "(test) execution started", ScheduledId = "someId", ScheduleFailed = false });
                }
            };
            var mockMessageListener = new MockServiceBusQueueMessageListener();

            // when
            await ProcessTestMessage(mockMessage, mockMessageListener, mockTaskClient, handler);

            // then - executed successfully
            Assert.IsTrue(executeCalled);
            Assert.IsTrue(mockMessageListener.IsCompleted);

            // then - job assigned was called
            Assert.AreEqual(1, mockTaskClient.EventsReceived.Count);
            var assignedEvent = mockTaskClient.EventsReceived[0] as JobAssignedEvent;
            Assert.IsNotNull(assignedEvent);
            Assert.AreEqual(testVstsMessage.JobId, assignedEvent.JobId);

            // then - timeline was created
            Assert.AreEqual(1, mockTaskClient.TimelineRecordsUpdated.Count);
            Assert.AreEqual(string.Format("someTimeline_{0}", testVstsMessage.JobId), mockTaskClient.TimelineRecordsUpdated[0].Name);

            // then - logs were written
            Assert.AreEqual(2, mockTaskClient.LogLines.Count);
        }

        [TestMethod]
        public async Task ExecuteGoldenPathCompleteSyncronouslyTest()
        {
            // given
            var testVstsMessage = CreateValidTestVstsMessage();
            testVstsMessage.CompleteSychronously = true;
            var mockMessage = CreateMockMessage(testVstsMessage);
            var mockTaskClient = new MockTaskClient();
            var mockReportingHelper = new MockJobStatusReportingHelper(testVstsMessage);
            var executeCalled = false;
            var handler = new MockVstsHandler
            {
                MockExecuteFunc = (vstsMessage) =>
                {
                    executeCalled = true;
                    return Task.FromResult(new VstsScheduleResult() { Message = "(test) execution started", ScheduledId = "someId", ScheduleFailed = false });
                }
            };

            // when
            await ProcessTestMessage(mockMessage, null, mockTaskClient, handler, mockReportingHelper);

            // then - executed successfully
            Assert.IsTrue(executeCalled);

            // then - job assigned & job completed was called
            Assert.AreEqual(1, mockTaskClient.EventsReceived.Count);
            var assignedEvent = mockTaskClient.EventsReceived[0] as JobAssignedEvent;
            Assert.IsNotNull(assignedEvent);
            Assert.AreEqual(1, mockReportingHelper.JobStatusReceived.Count);
            var completedMessage = mockReportingHelper.JobStatusReceived[0];
            Assert.AreEqual(MockJobStatusReportingHelper.JobStatusEnum.Completed, completedMessage);
            Assert.IsTrue(mockReportingHelper.JobStatusSuccess);
        }

        [TestMethod]
        public async Task ExecuteScheduleFailedGoldenPathTest()
        {
            // given
            var testVstsMessage = CreateValidTestVstsMessage();
            testVstsMessage.CompleteSychronously = true;
            var mockMessage = CreateMockMessage(testVstsMessage);
            var mockTaskClient = new MockTaskClient();
            var mockReportingHelper = new MockJobStatusReportingHelper(testVstsMessage);
            var executeCalled = false;
            var handler = new MockVstsHandler
            {
                MockExecuteFunc = (vstsMessage) =>
                {
                    executeCalled = true;
                    return Task.FromResult(new VstsScheduleResult() { Message = "some error message", ScheduleFailed = true });
                }
            };

            // when
            await ProcessTestMessage(mockMessage, null, mockTaskClient, handler, mockReportingHelper);

            // then - executed successfully
            Assert.IsTrue(executeCalled);

            // then - job assigned & job completed was called
            Assert.AreEqual(1, mockTaskClient.EventsReceived.Count);
            var assignedEvent = mockTaskClient.EventsReceived[0] as JobAssignedEvent;
            Assert.IsNotNull(assignedEvent);

            Assert.AreEqual(2, mockReportingHelper.JobStatusReceived.Count);
            var startedMessage = mockReportingHelper.JobStatusReceived[0];
            Assert.AreEqual(MockJobStatusReportingHelper.JobStatusEnum.Started, startedMessage);
            var completedMessage = mockReportingHelper.JobStatusReceived[1];
            Assert.AreEqual(MockJobStatusReportingHelper.JobStatusEnum.Completed, completedMessage);
            Assert.AreEqual(testVstsMessage.JobId, mockReportingHelper.VstsMessage.JobId);
            Assert.IsFalse(mockReportingHelper.JobStatusSuccess);
        }

        [TestMethod]
        public async Task CancelGoldenPathTest()
        {
            // given - a cancel message
            var testVstsMessage = CreateValidTestVstsMessage();
            testVstsMessage.RequestType = RequestType.Cancel;
            var mockMessage = CreateMockMessage(testVstsMessage);
            var mockTaskClient = new MockTaskClient();

            var cancelCalled = false;
            var handler = new MockVstsHandler
            {
                MockCancelFunc = (vstsMessage) =>
                {
                    Assert.IsNotNull(vstsMessage);
                    cancelCalled = true;
                    return Task.FromResult("(test) cancel reqeusted!");
                }
            };
            var mockMessageListener = new MockServiceBusQueueMessageListener();

            // when
            await ProcessTestMessage(mockMessage, mockMessageListener, mockTaskClient, handler);

            // then - cancelled successfully
            Assert.IsTrue(cancelCalled);
            Assert.IsTrue(mockMessageListener.IsCompleted);

            // then - job assigned is not called
            Assert.AreEqual(0, mockTaskClient.EventsReceived.Count);

            // then - timeline was created
            Assert.AreEqual(1, mockTaskClient.TimelineRecordsUpdated.Count);
            Assert.AreEqual(string.Format("someTimeline_{0}", testVstsMessage.JobId), mockTaskClient.TimelineRecordsUpdated[0].Name);

            // then - logs were written
            Assert.AreEqual(2, mockTaskClient.LogLines.Count);
        }

        [TestMethod]
        public async Task TimelineIsNotCreatedOnRetryTest()
        {
            // given - a message with a logId
            var mockMessage = CreateMockMessage(CreateValidTestVstsMessage());
            mockMessage.SetProperty(VstsMessageConstants.TaskLogIdPropertyName, 456);
            mockMessage.SetProperty(VstsMessageConstants.RetryAttemptPropertyName, 10);
            var mockTaskClient = new MockTaskClient();
            var mockMessageListener = new MockServiceBusQueueMessageListener();

            // when
            await ProcessTestMessage(mockMessage, mockMessageListener, mockTaskClient);

            // then - logs are written to existing timeline
            Assert.IsTrue(mockMessageListener.IsCompleted);
            Assert.AreEqual(0, mockTaskClient.TimelineRecordsUpdated.Count);
            Assert.AreEqual(2, mockTaskClient.LogLines.Count);
        }

        [TestMethod]
        public async Task TimelineIsPreservedAndRetryIsIncrementedOnAbandonTest()
        {
            // given - a message with a handler that fails
            var mockMessage = CreateMockMessage(CreateValidTestVstsMessage());
            mockMessage.SetProperty(VstsMessageConstants.TaskLogIdPropertyName, 456);
            var maxRetryAttempts = 10;
            var currRetry = 5;
            mockMessage.SetProperty(VstsMessageConstants.RetryAttemptPropertyName, currRetry);
            var mockTaskClient = new MockTaskClient();

            var executeCount = 0;
            var mockVstsHandler = new MockVstsHandler()
            {
                MockExecuteFunc =
                    msg =>
                    {
                        executeCount++;
                        throw new NotImplementedException("handler throws expected ex");
                    },
            };
            var mockMessageListener = new MockServiceBusQueueMessageListener();

            // when
            await ProcessTestMessage(mockMessage, mockMessageListener, mockTaskClient, mockVstsHandler, maxRetryAttempts: maxRetryAttempts);

            // then - logs are written to existing timeline
            Assert.IsTrue(mockMessageListener.IsAbandoned);
            Assert.AreEqual(0, mockTaskClient.TimelineRecordsUpdated.Count);
            // Assert.AreEqual("456", mockMessage.UpdatedProperties[VstsMessageConstants.TaskLogIdPropertyName]);
            // Assert.AreEqual((currRetry + 1).ToString(), mockMessage.UpdatedProperties[VstsMessageConstants.RetryAttemptPropertyName]);
            Assert.AreEqual(1, executeCount);
        }

        [TestMethod]
        public async Task MessageIsDeadLetteredAndAbandonsBuildOnMaxRetryTest()
        {
            // given - a message with a handler that fails
            var mockMessage = CreateMockMessage(CreateValidTestVstsMessage());
            mockMessage.SetProperty(VstsMessageConstants.TaskLogIdPropertyName, 456);
            var maxRetryAttempts = 10;
            var currRetry = 10;
            mockMessage.SetProperty(VstsMessageConstants.RetryAttemptPropertyName, currRetry);
            var mockTaskClient = new MockTaskClient();

            var executeCount = 0;
            var mockVstsHandler = new MockVstsHandler()
            {
                MockExecuteFunc =
                    msg =>
                    {
                        executeCount++;
                        throw new NotImplementedException("handler throws expected ex");
                    },
            };
            var mockMessageListener = new MockServiceBusQueueMessageListener();

            // when
            await ProcessTestMessage(mockMessage, mockMessageListener, mockTaskClient, mockVstsHandler, maxRetryAttempts: maxRetryAttempts);

            // then - logs are written to existing timeline
            Assert.IsTrue(mockMessageListener.IsDeadLettered);
            Assert.AreEqual(0, mockTaskClient.TimelineRecordsUpdated.Count);
            // Assert.AreEqual("456", mockMessage.UpdatedProperties[VstsMessageConstants.TaskLogIdPropertyName]);
            // Assert.AreEqual((currRetry + 1).ToString(), mockMessage.UpdatedProperties[VstsMessageConstants.RetryAttemptPropertyName]);
            // Assert.AreEqual("NotImplementedException", mockMessage.UpdatedProperties[VstsMessageConstants.ErrorTypePropertyName]);
            Assert.AreEqual(1, executeCount);

            // then - build was failed
            Assert.AreEqual(2, mockTaskClient.EventsReceived.Count);
            var assignedEvent = mockTaskClient.EventsReceived[0] as JobAssignedEvent;
            Assert.IsNotNull(assignedEvent);
            var completedEvent = mockTaskClient.EventsReceived[1] as JobCompletedEvent;
            Assert.IsNotNull(completedEvent);
            Assert.AreEqual(TaskResult.Abandoned, completedEvent.Result);
        }

        [TestMethod]
        public async Task ExecuteSkipsCancelledBuildTest()
        {
            // given - a message with a handler that fails
            var mockMessage = CreateMockMessage(CreateValidTestVstsMessage());

            var mockVstsHandler = new MockVstsHandler()
            {
                MockExecuteFunc =
                    msg =>
                    {
                        Assert.Fail("should not be called");
                        throw new NotImplementedException("should not be called");
                    },
            };
            var mockMessageListener = new MockServiceBusQueueMessageListener();

            var mockBuildClient = new MockBuildClient() { MockBuild = new Build() {Status = BuildStatus.Cancelling} };

            // when
            await ProcessTestMessage(mockMessage, mockMessageListener, new MockTaskClient(), mockVstsHandler, mockBuildClient: mockBuildClient);

            // then - logs are written to existing timeline
            Assert.IsTrue(mockMessageListener.IsCompleted);
        }

        [TestMethod]
        public async Task ExecuteSkipsDeletedBuildTest()
        {
            // given - a message with a handler that fails
            var mockMessage = CreateMockMessage(CreateValidTestVstsMessage());

            var mockVstsHandler = new MockVstsHandler()
            {
                MockExecuteFunc =
                    msg =>
                    {
                        Assert.Fail("should not be called");
                        throw new NotImplementedException("should not be called");
                    },
            };

            var mockBuildClient = new MockBuildClient() { ReturnNullBuild = true };
            var mockMessageListener = new MockServiceBusQueueMessageListener();

            // when
            await ProcessTestMessage(mockMessage, mockMessageListener, new MockTaskClient(), mockVstsHandler, mockBuildClient: mockBuildClient);

            // then - logs are written to existing timeline
            Assert.IsTrue(mockMessageListener.IsCompleted);
        }

        [TestMethod]
        public async Task BasicExecuteInstrumentationTest()
        {
            // given
            var traceBrokerInstrumentation = new TraceLogger();

            // when
            await ProcessTestMessage(logger: traceBrokerInstrumentation);

            // then
            Assert.AreEqual(3, traceBrokerInstrumentation.Events.Count);
        }

        [TestMethod]
        public async Task HandlerExecuteExceptionTest()
        {
            // given
            var handler = new MockVstsHandler { MockExecuteFunc = (vstsMessage) => throw new NotSupportedException("not supported.")};
            var traceLogger = new TraceLogger();
            var mockMessage = CreateMockMessage(CreateValidTestVstsMessage());
            var mockMessageListener = new MockServiceBusQueueMessageListener();

            // when
            await ProcessTestMessage(handler: handler, mockMessageListener: mockMessageListener, logger: traceLogger, mockServiceBusMessage: mockMessage);

            // then
            Assert.IsTrue(mockMessageListener.IsAbandoned);
        }

        [TestMethod]
        public async Task HandlerCancelExceptionTest()
        {
            // given
            var handler = new MockVstsHandler { MockCancelFunc = (vstsMessage) => throw new NotSupportedException("not supported.")};
            var traceBrokerInstrumentation = new TraceLogger();
            var mockMessage = CreateMockMessage(CreateValidTestVstsMessage());
            var mockMessageListener = new MockServiceBusQueueMessageListener();

            // when
            await ProcessTestMessage(handler: handler, mockMessageListener: mockMessageListener, logger: traceBrokerInstrumentation, mockServiceBusMessage: mockMessage);

            // then
            Assert.IsTrue(mockMessageListener.IsAbandoned);
        }

        internal static TestVstsMessage CreateValidTestVstsMessage()
        {
            var vstsBuildProperties = new VstsBuildProperties { SourceControlServerUri = "haha" };
            var testVstsMessage = new TestVstsMessage() { VstsHub = HubType.Build, VstsUrl = "http://vstsUrl", VstsPlanUrl = "http://vstsPlanUrl", AuthToken = "someToken", ProjectId = Guid.NewGuid(), JobId = Guid.NewGuid(), PlanId = Guid.NewGuid(), BuildProperties = vstsBuildProperties };
            return testVstsMessage;
        }

        internal static TestVstsMessage CreateValidTestVstsMessageForRelease()
        {
            var vstsReleaseProperties = new VstsReleaseProperties() { ReleaseId = 123, ReleaseDefinitionName = "someReleaseDef", ReleaseEnvironmentName = "env123", ReleaseEnvironmentUri = new Uri("foo://bar"), ReleaseName = "someRelease", ReleaseUri = new Uri("foo://bar") };
            var testVstsMessage = new TestVstsMessage() { VstsHub = HubType.Release, VstsUrl = "http://vstsUrl", VstsPlanUrl = "http://vstsPlanUrl", AuthToken = "someToken", ProjectId = Guid.NewGuid(), JobId = Guid.NewGuid(), PlanId = Guid.NewGuid(), ReleaseProperties = vstsReleaseProperties };
            return testVstsMessage;
        }

        internal static MockServiceBusMessage CreateMockMessage(TestVstsMessage testMessage)
        {
            var testMessageJson = JsonConvert.SerializeObject(testMessage);
            var mockMessage = new MockServiceBusMessage { BodyObject = testMessageJson };
            return mockMessage;
        }

        private static async Task ProcessTestMessage(MockServiceBusMessage mockServiceBusMessage = null, MockServiceBusQueueMessageListener mockMessageListener = null, MockTaskClient mockTaskClient = null, MockVstsHandler handler = null, IJobStatusReportingHelper mockReportingHelper = null, ILogger logger = null, int maxRetryAttempts = 1, IBuildClient mockBuildClient = null)
        {
            var testVstsMessage = CreateValidTestVstsMessage();
            mockServiceBusMessage = mockServiceBusMessage ?? CreateMockMessage(testVstsMessage);
            mockTaskClient = mockTaskClient ?? new MockTaskClient();
            mockBuildClient = mockBuildClient ?? new MockBuildClient() { MockBuild = new Build() { Status = BuildStatus.InProgress } };
            //mockReportingHelper = mockReportingHelper ?? new MockJobStatusReportingHelper(new TestVstsMessage());
            var mockReleaseClient = new MockReleaseClient() { MockRelease = new Release() {Status = ReleaseStatus.Active} };
            handler = handler ?? new MockVstsHandler { MockExecuteFunc = (vstsMessage) => Task.FromResult(new VstsScheduleResult() { Message = "(test) mock execute requested", ScheduledId = "someId", ScheduleFailed = false }) };
            logger = logger ?? new TraceLogger();
            mockReportingHelper = mockReportingHelper ?? new TestableJobStatusReportingHelper(testVstsMessage, logger, mockTaskClient, mockReleaseClient, mockBuildClient);
            var settings = new ServiceBusQueueMessageHandlerSettings { MaxRetryAttempts = maxRetryAttempts, TimeLineNamePrefix = "someTimeline", WorkerName = "someWorker" };
            mockMessageListener = mockMessageListener ?? new MockServiceBusQueueMessageListener();
            var schedulingBroker = new TestableServiceBusQueueMessageHandler(mockMessageListener, handler, settings, logger, mockTaskClient, mockBuildClient, mockReportingHelper, mockReleaseClient);
            var cancelSource = new CancellationTokenSource();
            await schedulingBroker.ReceiveAsync(mockServiceBusMessage, cancelSource.Token);
        }
    }
}
