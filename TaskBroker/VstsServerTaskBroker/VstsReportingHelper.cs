using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;

using VstsServerTaskBroker.Contracts;

namespace VstsServerTaskBroker
{
    public class VstsReportingHelper : IVstsReportingHelper
    {
        private readonly VstsMessageBase vstsContext;
        private readonly IBrokerInstrumentation baseInstrumentation;
        private readonly IDictionary<string, string> eventProperties;

        public Func<Uri, string, IBrokerInstrumentation, bool, ITaskHttpClient> CreateTaskHttpClient { get; set; }

        public Func<Uri, string, IBuildHttpClientWrapper> CreateBuildClient { get; set; }

        public Func<Uri, string, IReleaseHttpClientWrapper> CreateReleaseClient { get; set; }

        public VstsReportingHelper(VstsMessageBase vstsContext, IBrokerInstrumentation baseInstrumentation, IDictionary<string, string> eventProperties)
        {
            this.vstsContext = vstsContext;
            this.baseInstrumentation = baseInstrumentation;
            this.eventProperties = this.vstsContext.GetMessageProperties().AddRange(eventProperties);

            this.CreateTaskHttpClient = (uri, authToken, instrumentationHelper, skipRaisePlanEvents) => TaskHttpClientWrapperFactory.GetTaskHttpClientWrapper(uri, authToken, instrumentationHelper, skipRaisePlanEvents);
            this.CreateBuildClient = (uri, authToken) => new BuildHttpClientWrapper(uri, new VssBasicCredential(string.Empty, authToken));
            this.CreateReleaseClient = (uri, authToken) => new ReleaseHttpClientWrapper(uri, new VssBasicCredential(string.Empty, authToken));
        }

        public async Task ReportJobStarted(DateTimeOffset offsetTime, string message, CancellationToken cancellationToken)
        {
            var vstsPlanUrl = this.vstsContext.VstsPlanUri;
            var vstsUrl = this.vstsContext.VstsUri;
            var authToken = this.vstsContext.AuthToken;
            var planId = this.vstsContext.PlanId;
            var projectId = this.vstsContext.ProjectId;
            var jobId = this.vstsContext.JobId;
            var hubName = this.vstsContext.VstsHub.ToString();
            var eventTime = offsetTime.UtcDateTime;

            var buildHttpClientWrapper = this.CreateBuildClient(vstsUrl, authToken);
            var releaseHttpClientWrapper = this.CreateReleaseClient(vstsPlanUrl, authToken);
            var isSessionValid = await IsSessionValid(this.vstsContext, buildHttpClientWrapper, releaseHttpClientWrapper, cancellationToken).ConfigureAwait(false);
            if (!isSessionValid)
            {
                await this.baseInstrumentation.HandleInfoEvent("SessionAlreadyCancelled", "Skipping ReportJobStarted for cancelled or deleted build/release", this.eventProperties, cancellationToken).ConfigureAwait(false);
                return;
            }

            var taskHttpClientWrapper = this.CreateTaskHttpClient(vstsPlanUrl, authToken, this.baseInstrumentation, this.vstsContext.SkipRaisePlanEvents);
            var vstsBrokerInstrumentation = new VstsBrokerInstrumentation(this.baseInstrumentation, taskHttpClientWrapper, hubName, projectId, planId, this.vstsContext.TaskLogId, this.eventProperties);
            var startedEvent = new JobStartedEvent(jobId);
            await taskHttpClientWrapper.RaisePlanEventAsync(projectId, hubName, planId, startedEvent, cancellationToken).ConfigureAwait(false);
            await vstsBrokerInstrumentation.HandleInfoEvent("JobStarted", message, this.eventProperties, cancellationToken, eventTime);
        }

        public async Task ReportJobProgress(DateTimeOffset offsetTime, string message, CancellationToken cancellationToken)
        {
            var vstsPlanUrl = this.vstsContext.VstsPlanUri;
            var authToken = this.vstsContext.AuthToken;
            var planId = this.vstsContext.PlanId;
            var projectId = this.vstsContext.ProjectId;
            var hubName = this.vstsContext.VstsHub.ToString();
            var timelineId = this.vstsContext.TimelineId;
            var eventTime = offsetTime.UtcDateTime;

            var taskHttpClientWrapper = this.CreateTaskHttpClient(vstsPlanUrl, authToken, this.baseInstrumentation, this.vstsContext.SkipRaisePlanEvents);
            var vstsBrokerInstrumentation = new VstsBrokerInstrumentation(this.baseInstrumentation, taskHttpClientWrapper, hubName, projectId, planId, this.vstsContext.TaskLogId, this.eventProperties);

            try
            {
                await vstsBrokerInstrumentation.HandleInfoEvent("JobRunning", message, this.eventProperties, cancellationToken, eventTime);
            }
            catch (TaskOrchestrationPlanNotFoundException)
            {
                // ignore deleted builds
            }

            // Find all existing timeline records and set them to in progress state
            var records = await taskHttpClientWrapper.GetRecordsAsync(projectId, hubName, planId, timelineId, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);
            
            foreach (var record in records)
            {
                record.State = TimelineRecordState.InProgress;
            }

            await taskHttpClientWrapper.UpdateTimelineRecordsAsync(projectId, hubName, planId, timelineId, records, cancellationToken).ConfigureAwait(false);
        }

        public async Task ReportJobCompleted(DateTimeOffset offsetTime, string message, bool isPassed, CancellationToken cancellationToken)
        {
            var vstsPlanUrl = this.vstsContext.VstsPlanUri;
            var vstsUrl = this.vstsContext.VstsUri;
            var authToken = this.vstsContext.AuthToken;
            var planId = this.vstsContext.PlanId;
            var projectId = this.vstsContext.ProjectId;
            var jobId = this.vstsContext.JobId;
            var hubName = this.vstsContext.VstsHub.ToString();
            var timelineId = this.vstsContext.TimelineId;
            var eventTime = offsetTime.UtcDateTime;

            var buildHttpClientWrapper = this.CreateBuildClient(vstsUrl, authToken);
            var releaseHttpClientWrapper = this.CreateReleaseClient(vstsPlanUrl, authToken);
            var isSessionValid = await IsSessionValid(this.vstsContext, buildHttpClientWrapper, releaseHttpClientWrapper, cancellationToken).ConfigureAwait(false);
            if (!isSessionValid)
            {
                await this.baseInstrumentation.HandleInfoEvent("SessionAlreadyCancelled", "Skipping ReportJobStarted for cancelled or deleted build", this.eventProperties, cancellationToken).ConfigureAwait(false);
                return;
            }

            var taskHttpClientWrapper = this.CreateTaskHttpClient(vstsPlanUrl, authToken, this.baseInstrumentation, this.vstsContext.SkipRaisePlanEvents);
            var vstsBrokerInstrumentation = new VstsBrokerInstrumentation(this.baseInstrumentation, taskHttpClientWrapper, hubName, projectId, planId, this.vstsContext.TaskLogId, this.eventProperties);

            var completedEvent = new JobCompletedEvent(jobId, isPassed ? TaskResult.Succeeded : TaskResult.Failed);
            await taskHttpClientWrapper.RaisePlanEventAsync(projectId, hubName, planId, completedEvent, cancellationToken).ConfigureAwait(false);

            if (isPassed)
            {
                await vstsBrokerInstrumentation.HandleInfoEvent("JobCompleted", message, this.eventProperties, cancellationToken, eventTime);
            }
            else
            {
                await vstsBrokerInstrumentation.HandleErrorEvent("JobFailed", message, this.eventProperties, cancellationToken, eventTime);
            }

            // Find all existing timeline records and close them
            await CompleteTimelineRecords(projectId, planId, hubName, timelineId, isPassed ? TaskResult.Succeeded : TaskResult.Failed, cancellationToken, taskHttpClientWrapper);
        }

        public static async Task CompleteTimelineRecords(Guid projectId, Guid planId, string hubName, Guid parentTimelineId, TaskResult result, CancellationToken cancellationToken, ITaskHttpClient taskHttpClient)
        {
            // Find all existing timeline records and close them
            var records = await taskHttpClient.GetRecordsAsync(projectId, hubName, planId, parentTimelineId, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);
            foreach (var record in records)
            {
                record.State = TimelineRecordState.Completed;
                record.PercentComplete = 100;
                record.Result = result;
                record.FinishTime = DateTime.UtcNow;
            }

            await taskHttpClient.UpdateTimelineRecordsAsync(projectId, hubName, planId, parentTimelineId, records, cancellationToken).ConfigureAwait(false);
        }

        internal static async Task<bool> IsSessionValid(VstsMessageBase vstsMessage, IBuildHttpClientWrapper buildHttpClientWrapper, IReleaseHttpClientWrapper releaseHttpClientWrapper, CancellationToken cancellationToken)
        {
            var projectId = vstsMessage.ProjectId;
            var vstsUrl = vstsMessage.VstsPlanUri;
            var authToken = vstsMessage.AuthToken;

            if (vstsMessage.VstsHub == HubType.Build)
            {
                var buildId = vstsMessage.BuildProperties.BuildId;
                return await BuildHttpClientWrapper.IsBuildValid(buildHttpClientWrapper, projectId, buildId, cancellationToken).ConfigureAwait(false);
            }

            if (vstsMessage.VstsHub == HubType.Release)
            {
                var releaseId = vstsMessage.ReleaseProperties.ReleaseId;
                return await ReleaseHttpClientWrapper.IsReleaseValid(releaseHttpClientWrapper, projectId, releaseId, cancellationToken).ConfigureAwait(false);
            }

            throw new NotSupportedException(string.Format("VstsHub {0} is not supported", vstsMessage.VstsHub));
        }
    }
}