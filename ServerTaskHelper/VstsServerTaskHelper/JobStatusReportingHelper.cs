using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;

namespace VstsServerTaskHelper
{
    public class JobStatusReportingHelper : IJobStatusReportingHelper
    {
        private readonly VstsMessage vstsMessage;
        private readonly ILogger logger;
        private readonly IDictionary<string, string> eventProperties;

        /// <summary>
        /// Optional timeline record name. If specified only this timeline will be updated instead of all timelines.
        /// </summary>
        private readonly string timelineRecordName;

        public JobStatusReportingHelper(VstsMessage vstsMessage, ILogger logger, string timelineRecordName = null)
        {
            this.vstsMessage = vstsMessage;
            this.logger = logger;
            this.timelineRecordName = timelineRecordName;
            this.eventProperties = this.vstsMessage.GetMessageProperties();
        }

        public async Task ReportJobStarted(DateTimeOffset offsetTime, string message, CancellationToken cancellationToken)
        {
            var vstsPlanUrl = this.vstsMessage.VstsPlanUri;
            var vstsUrl = this.vstsMessage.VstsUri;
            var authToken = this.vstsMessage.AuthToken;
            var planId = this.vstsMessage.PlanId;
            var projectId = this.vstsMessage.ProjectId;
            var jobId = this.vstsMessage.JobId;
            var hubName = this.vstsMessage.VstsHub.ToString();
            var eventTime = offsetTime.UtcDateTime;

            var buildHttpClientWrapper = GetBuildClient(vstsUrl, authToken);
            var releaseHttpClientWrapper = GetReleaseClient(vstsPlanUrl, authToken);
            var isSessionValid = await IsSessionValid(this.vstsMessage, buildHttpClientWrapper, releaseHttpClientWrapper, cancellationToken).ConfigureAwait(false);
            if (!isSessionValid)
            {
                await this.logger.LogInfo("SessionAlreadyCancelled", "Skipping ReportJobStarted for cancelled or deleted build/release", this.eventProperties, cancellationToken).ConfigureAwait(false);
                return;
            }

            var startedEvent = new JobStartedEvent(jobId);
            var taskClient = GetTaskClient(this.vstsMessage.VstsPlanUri, this.vstsMessage.AuthToken, this.vstsMessage.SkipRaisePlanEvents);
            await taskClient.RaisePlanEventAsync(projectId, hubName, planId, startedEvent, cancellationToken).ConfigureAwait(false);
            await logger.LogInfo("JobStarted", message, this.eventProperties, cancellationToken, eventTime);
        }

        public async Task ReportJobProgress(DateTimeOffset offsetTime, string message, CancellationToken cancellationToken)
        {
            var planId = this.vstsMessage.PlanId;
            var projectId = this.vstsMessage.ProjectId;
            var hubName = this.vstsMessage.VstsHub.ToString();
            var timelineId = this.vstsMessage.TimelineId;
            var eventTime = offsetTime.UtcDateTime;

            try
            {
                await logger.LogInfo("JobRunning", message, this.eventProperties, cancellationToken, eventTime);
            }
            catch (TaskOrchestrationPlanNotFoundException)
            {
                // ignore deleted builds
            }

            // Find all existing timeline records and set them to in progress state
            var taskClient = GetTaskClient(this.vstsMessage.VstsPlanUri, this.vstsMessage.AuthToken, this.vstsMessage.SkipRaisePlanEvents);
            var records = await taskClient.GetRecordsAsync(projectId, hubName, planId, timelineId, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);

            var recordsToUpdate = GetTimelineRecordsToUpdate(records);
            foreach (var record in recordsToUpdate)
            {
                record.State = TimelineRecordState.InProgress;
            }

            await taskClient.UpdateTimelineRecordsAsync(projectId, hubName, planId, timelineId, recordsToUpdate, cancellationToken).ConfigureAwait(false);
        }

        public async Task ReportJobCompleted(DateTimeOffset offsetTime, string message, bool isPassed, CancellationToken cancellationToken)
        {
            var vstsPlanUrl = this.vstsMessage.VstsPlanUri;
            var vstsUrl = this.vstsMessage.VstsUri;
            var authToken = this.vstsMessage.AuthToken;
            var planId = this.vstsMessage.PlanId;
            var projectId = this.vstsMessage.ProjectId;
            var jobId = this.vstsMessage.JobId;
            var hubName = this.vstsMessage.VstsHub.ToString();
            var timelineId = this.vstsMessage.TimelineId;
            var eventTime = offsetTime.UtcDateTime;

            var buildHttpClientWrapper = GetBuildClient(vstsUrl, authToken);
            var releaseHttpClientWrapper = GetReleaseClient(vstsPlanUrl, authToken);
            var isSessionValid = await IsSessionValid(this.vstsMessage, buildHttpClientWrapper, releaseHttpClientWrapper, cancellationToken).ConfigureAwait(false);
            if (!isSessionValid)
            {
                await this.logger.LogInfo("SessionAlreadyCancelled", "Skipping ReportJobStarted for cancelled or deleted build", this.eventProperties, cancellationToken).ConfigureAwait(false);
                return;
            }

            var completedEvent = new JobCompletedEvent(jobId, isPassed ? TaskResult.Succeeded : TaskResult.Failed);
            var taskClient = GetTaskClient(this.vstsMessage.VstsPlanUri, this.vstsMessage.AuthToken, this.vstsMessage.SkipRaisePlanEvents);
            await taskClient.RaisePlanEventAsync(projectId, hubName, planId, completedEvent, cancellationToken).ConfigureAwait(false);

            if (isPassed)
            {
                await logger.LogInfo("JobCompleted", message, this.eventProperties, cancellationToken, eventTime);
            }
            else
            {
                await logger.LogError("JobFailed", message, this.eventProperties, cancellationToken, eventTime);
            }

            // Find all existing timeline records and close them
            await this.CompleteTimelineRecords(projectId, planId, hubName, timelineId, isPassed ? TaskResult.Succeeded : TaskResult.Failed, cancellationToken, taskClient);
        }

        public async Task TryAbandonJob(CancellationToken cancellationToken)
        {
            if (vstsMessage == null)
            {
                return;
            }

            try
            {
                var projectId = vstsMessage.ProjectId;
                var planId = vstsMessage.PlanId;
                var vstsPlanUrl = vstsMessage.VstsPlanUri;
                var authToken = vstsMessage.AuthToken;
                var jobId = vstsMessage.JobId;
                var hubName = vstsMessage.VstsHub.ToString();
                var taskHttpClient = GetTaskClient(vstsPlanUrl, authToken, vstsMessage.SkipRaisePlanEvents);
                var completedEvent = new JobCompletedEvent(jobId, TaskResult.Abandoned);
                await taskHttpClient.RaisePlanEventAsync(projectId, hubName, planId, completedEvent, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception)
            {
                // yes this really is a horrible best effort that ignores all ex's.
            }
        }

        internal async Task CompleteTimelineRecords(Guid projectId, Guid planId, string hubName, Guid parentTimelineId, TaskResult result, CancellationToken cancellationToken, ITaskClient taskClient)
        {
            // Find all existing timeline records and close them
            var records = await taskClient.GetRecordsAsync(projectId, hubName, planId, parentTimelineId, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);
            var recordsToUpdate = GetTimelineRecordsToUpdate(records);

            foreach (var record in recordsToUpdate)
            {
                record.State = TimelineRecordState.Completed;
                record.PercentComplete = 100;
                record.Result = result;
                record.FinishTime = DateTime.UtcNow;
            }

            await taskClient.UpdateTimelineRecordsAsync(projectId, hubName, planId, parentTimelineId, recordsToUpdate, cancellationToken).ConfigureAwait(false);
        }

        internal static async Task<bool> IsSessionValid(VstsMessage vstsMessage, IBuildClient buildClient, IReleaseClient releaseClient, CancellationToken cancellationToken)
        {
            var projectId = vstsMessage.ProjectId;

            if (vstsMessage.VstsHub == HubType.Build)
            {
                var buildId = vstsMessage.BuildProperties.BuildId;
                return await BuildClient.IsBuildValid(buildClient, projectId, buildId, cancellationToken).ConfigureAwait(false);
            }

            if (vstsMessage.VstsHub == HubType.Release)
            {
                var releaseId = vstsMessage.ReleaseProperties.ReleaseId;
                return await ReleaseClient.IsReleaseValid(releaseClient, projectId, releaseId, cancellationToken).ConfigureAwait(false);
            }

            throw new NotSupportedException(String.Format("VstsHub {0} is not supported", vstsMessage.VstsHub));
        }

        private List<TimelineRecord> GetTimelineRecordsToUpdate(List<TimelineRecord> records)
        {
            if (String.IsNullOrEmpty(timelineRecordName))
            {
                return records.Where(rec => rec.Id == this.vstsMessage.JobId || rec.ParentId == this.vstsMessage.JobId)
                    .ToList();
            }

            return records.Where(rec => rec.Name != null && rec.Name.Equals(timelineRecordName, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        protected virtual ITaskClient GetTaskClient(Uri vstsPlanUrl, string authToken, bool skipRaisePlanEvents)
        {
            return TaskClientFactory.GetTaskClient(vstsPlanUrl, authToken, logger, skipRaisePlanEvents);
        }

        protected virtual IReleaseClient GetReleaseClient(Uri uri, string authToken)
        {
            return new ReleaseClient(uri, new VssBasicCredential(String.Empty, authToken));
        }

        protected virtual IBuildClient GetBuildClient(Uri uri, string authToken)
        {
            return new BuildClient(uri, new VssBasicCredential(String.Empty, authToken));
        }
    }
}