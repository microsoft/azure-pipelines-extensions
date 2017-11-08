using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using VstsServerTaskBroker.Contracts;

namespace VstsServerTaskBroker
{
    public class MockVstsReportingHelper : IVstsReportingHelper
    {
        public enum JobStatusEnum
        {
            Started,
            InProgress,
            Completed,
        }

        public VstsMessageBase VstsMessage { get; set; }

        public List<JobStatusEnum> JobStatusReceived { get; set; }

        public bool JobStatusSuccess { get; set; }

        public MockVstsReportingHelper(VstsMessageBase vstsContext)
        {
            this.VstsMessage = vstsContext;
            this.JobStatusReceived = new List<JobStatusEnum>();
        }

        public async Task ReportJobStarted(DateTimeOffset offsetTime, string message, CancellationToken cancellationToken)
        {
            JobStatusReceived.Add(JobStatusEnum.Started);
            await Task.FromResult<object>(null);
        }

        public async Task ReportJobProgress(DateTimeOffset offsetTime, string message, CancellationToken cancellationToken)
        {
            JobStatusReceived.Add(JobStatusEnum.InProgress);
            await Task.FromResult<object>(null);
        }

        public async Task ReportJobCompleted(DateTimeOffset offsetTime, string message, bool isPassed, CancellationToken cancellationToken)
        {
            JobStatusReceived.Add(JobStatusEnum.Completed);
            JobStatusSuccess = isPassed;
            await Task.FromResult<object>(null);
        }
    }
}
