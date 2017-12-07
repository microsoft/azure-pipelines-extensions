using System;

namespace VstsServerTaskHelper.UnitTests
{
    public class TestableServiceBusQueueMessageHandler : ServiceBusQueueMessageHandler<TestVstsMessage>
    {
        private readonly ITaskClient taskClient;
        private readonly IJobStatusReportingHelper jobStatusReportingHelper;
        private readonly IReleaseClient releaseClient;
        private readonly IBuildClient buildClient;

        public TestableServiceBusQueueMessageHandler(IServiceBusQueueMessageListener serviceBusQueueMessageListener, IVstsScheduleHandler<TestVstsMessage> handler, ServiceBusQueueMessageHandlerSettings settings, ILogger logger, ITaskClient taskClient, IBuildClient buildClient, IJobStatusReportingHelper jobStatusReportingHelper, IReleaseClient releaseClient)
            : base(serviceBusQueueMessageListener, handler, settings, logger)
        {
            this.taskClient = taskClient;
            this.buildClient = buildClient;
            this.releaseClient = releaseClient;
            this.jobStatusReportingHelper = jobStatusReportingHelper;
        }

        protected override IJobStatusReportingHelper GetVstsJobStatusReportingHelper(VstsMessage vstsMessage, ILogger inst)
        {
            return this.jobStatusReportingHelper;
        }

        protected override IReleaseClient GetReleaseClient(Uri uri, string authToken)
        {
            return this.releaseClient;
        }

        protected override IBuildClient GetBuildClient(Uri uri, string authToken)
        {
            return this.buildClient;
        }

        protected override ITaskClient GetTaskClient(Uri vstsPlanUrl, string authToken, bool skipRaisePlanEvents)
        {
            return this.taskClient;
        }
    }
}