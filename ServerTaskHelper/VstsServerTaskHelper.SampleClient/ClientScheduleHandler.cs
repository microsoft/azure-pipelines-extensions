using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper.SampleClient
{
    public class ClientScheduleHandler : IVstsScheduleHandler<VstsMessage>
    {
        private readonly ILogger logger;
        private const string ServiceName = "Microservice";

        public ClientScheduleHandler(ILogger logger)
        {
            this.logger = logger;
        }

        public async Task<VstsScheduleResult> Execute(VstsMessage vstsMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken)
        {
            // validate the message
            string validationErrors;
            if (!ValidateVstsMessage(vstsMessage, out validationErrors))
            {
                return new VstsScheduleResult
                {
                    ScheduleFailed = true,
                    Message = string.Format("Invalid message please check your VSTS build/release configuration. Errors: {0}", validationErrors),
                };
            }

            var scheduleResult = await InitializeScheduleRequestArtifactSource(vstsMessage).ConfigureAwait(false);
            if (!scheduleResult.ScheduleFailed)
            {
                scheduleResult.ScheduledId = vstsMessage.JobId.ToString();
            }

            var jobStatusReportingHelper = new JobStatusReportingHelper(vstsMessage, this.logger);

            await ReportJobStarted(vstsMessage, cancellationToken, jobStatusReportingHelper);

            await ReportJobProgress(vstsMessage, cancellationToken, jobStatusReportingHelper);

            await ReportJobCompleted(vstsMessage, cancellationToken, jobStatusReportingHelper);
            
            return scheduleResult;
        }

        public async Task<string> Cancel(VstsMessage vstsMessage, CancellationToken cancellationToken)
        {
            var testSessionId = vstsMessage.JobId;

            return await Task.FromResult<string>(string.Format("Test session {0} Cancelled", testSessionId));
        }

        private async Task ReportJobCompleted(VstsMessage vstsMessage, CancellationToken cancellationToken, IJobStatusReportingHelper jobStatusReportingHelper)
        {
            await Task.Delay(5000, cancellationToken);
            var message = string.Format("[{0}] completed processing session [{1}]", ServiceName, vstsMessage.JobId);
            await jobStatusReportingHelper.ReportJobCompleted(DateTime.UtcNow, message, true, CancellationToken.None).ConfigureAwait(false);
        }

        private static async Task ReportJobProgress(VstsMessage vstsMessage, CancellationToken cancellationToken, IJobStatusReportingHelper jobStatusReportingHelper)
        {
            await Task.Delay(5000, cancellationToken);
            var message = string.Format("Job [{0}] is requested by user [{1}] with email {2}", vstsMessage.JobId, vstsMessage.RequesterName, vstsMessage.RequesterEmail);
            await jobStatusReportingHelper.ReportJobProgress(DateTime.UtcNow, message, CancellationToken.None).ConfigureAwait(false);
        }

        private async Task ReportJobStarted(VstsMessage vstsMessage, CancellationToken cancellationToken, IJobStatusReportingHelper jobStatusReportingHelper)
        {
            await Task.Delay(5000, cancellationToken);
            var message = string.Format("[{0}] started processing job session [{1}]", ServiceName, vstsMessage.JobId);
            await this.logger.LogInfo("Info", message, new Dictionary<string, string>(), CancellationToken.None);
            await jobStatusReportingHelper.ReportJobStarted(DateTime.UtcNow, message, CancellationToken.None).ConfigureAwait(false);
        }

        private static async Task<VstsScheduleResult> InitializeScheduleRequestArtifactSource(VstsMessage vstsMessage)
        {
            VstsScheduleResult scheduleResult;
            try
            {
                switch (vstsMessage.VstsHub)
                {
                    case HubType.Build:
                        // Handle build specific messages
                        break;

                    case HubType.Release:
                        // Handle release specific messages
                        break;

                    default:
                        throw new NotSupportedException(string.Format("Doesn't support [{0}] as an artifact source", vstsMessage.VstsHub));
                }
                scheduleResult = new VstsScheduleResult()
                {
                    ScheduleFailed = false
                };
            }
            catch (VstsArtifactsNotFoundException ex)
            {
                scheduleResult = new VstsScheduleResult()
                {
                    ScheduleFailed = true,
                    Message = ex.Message,
                };
            }

            return await Task.FromResult(scheduleResult);
        }
        
        private static bool ValidateVstsMessage(VstsMessage vstsMessage, out string validationErrors)
        {
            if (vstsMessage == null)
            {
                validationErrors = "vstsMessage is null. Check that you are using a valid agentless task.";
                return false;
            }

            if (string.IsNullOrEmpty(vstsMessage.RequesterName) && vstsMessage.TimelineId != Guid.Empty)
            {
                validationErrors = "Requester name or time line id is required";
                return false;
            }

            validationErrors = null;
            return true;
        }
    }
}