using System;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi;

namespace VstsServerTaskHelper.UnitTests
{
    public class TestableHandlerWithInstrumentation<T> : HandlerWithInstrumentation<T> where T: VstsMessage
    {
        private readonly ITaskClient taskClient;
        private readonly IBuildClient buildClient;
        private readonly IReleaseClient releaseClient;
        private readonly IJobStatusReportingHelper jobStatusReportingHelper;

        public TestableHandlerWithInstrumentation(ILogger logger, IVstsScheduleHandler<T> handler):
            base(logger, handler)
        {
            this.taskClient = new MockTaskClient();
            this.buildClient = new MockBuildClient { MockBuild = new Build() { Status = BuildStatus.InProgress } }; ;
            this.releaseClient = new MockReleaseClient { MockRelease = new Release() { Status = ReleaseStatus.Active } };
            this.jobStatusReportingHelper = new MockJobStatusReportingHelper(new TestVstsMessage());
        }

        public TestableHandlerWithInstrumentation(ILogger logger, IVstsScheduleHandler<T> baseHandler, ITaskClient taskClient, IBuildClient buildClient, IReleaseClient releaseClient, IJobStatusReportingHelper jobStatusReportingHelper) : base(logger, baseHandler)
        {
            this.taskClient = taskClient;
            this.buildClient = buildClient;
            this.releaseClient = releaseClient;
            this.jobStatusReportingHelper = jobStatusReportingHelper;
        }

        protected override IJobStatusReportingHelper GetVstsJobStatusReportingHelper(VstsMessage vstsMessage, ILogger logger)
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