using System;

namespace VstsServerTaskHelper.UnitTests
{
    public class TestableJobStatusReportingHelper : JobStatusReportingHelper
    {
        private readonly ITaskClient mockTaskHttpClient;
        private readonly IReleaseClient releaseClient;
        private readonly IBuildClient mockBuildClient;

        public TestableJobStatusReportingHelper(VstsMessage vstsMessage, ILogger traceLogger, ITaskClient mockTaskHttpClient, IReleaseClient releaseClient, IBuildClient mockBuildClient, string timeLineRecordName = null)
            :base(vstsMessage, traceLogger, timeLineRecordName)
        {
            this.mockTaskHttpClient = mockTaskHttpClient;
            this.releaseClient = releaseClient;
            this.mockBuildClient = mockBuildClient;
        }

        protected override ITaskClient GetTaskClient(Uri vstsPlanUrl, string authToken, bool skipRaisePlanEvents)
        {
            return mockTaskHttpClient;
        }

        protected override IReleaseClient GetReleaseClient(Uri uri, string authToken)
        {
            return this.releaseClient;
        }

        protected override IBuildClient GetBuildClient(Uri uri, string authToken)
        {
            return this.mockBuildClient;
        }
    }
}