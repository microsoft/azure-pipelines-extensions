using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using VstsServerTaskHelper.Core.Request;

namespace VstsServerTaskHelper.Core.TaskProgress
{
    public class JobStatusReportingHelper
    {
        private readonly TaskProperties taskProperties;
        private readonly TaskLogger taskLogger;

        public JobStatusReportingHelper(TaskProperties taskProperties)
        {
            this.taskProperties = taskProperties;
            var vssBasicCredential = new VssBasicCredential(string.Empty, taskProperties.AuthToken);
            var planClient = new PlanHelper(taskProperties.PlanUri, vssBasicCredential, taskProperties.ProjectId, taskProperties.HubName, taskProperties.PlanId);
            taskLogger = new TaskLogger(planClient, taskProperties.TimelineId, taskProperties.JobId, taskProperties.TaskInstanceId);
        }

        public async Task ReportJobAssigned(string message, CancellationToken cancellationToken)
        {
            var startedEvent = new JobAssignedEvent(this.taskProperties.JobId);
            var taskClient = GetTaskClient(this.taskProperties.PlanUri, this.taskProperties.AuthToken);
            await taskClient.RaisePlanEventAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, startedEvent, cancellationToken).ConfigureAwait(false);
            this.taskLogger.Log($"Job started: {message}");
        }

        public async Task ReportJobStarted(string message, CancellationToken cancellationToken)
        {
            var startedEvent = new JobStartedEvent(this.taskProperties.JobId);
            var taskClient = GetTaskClient(this.taskProperties.PlanUri, this.taskProperties.AuthToken);
            await taskClient.RaisePlanEventAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, startedEvent, cancellationToken).ConfigureAwait(false);
            this.taskLogger.Log($"Job started: {message}");
        }

        public async Task ReportJobProgress(string message, CancellationToken cancellationToken)
        {
            try
            {
                this.taskLogger.Log($"Job running: {message}");
            }
            catch (TaskOrchestrationPlanNotFoundException)
            {
                // ignore deleted builds
            }

            // Find all existing timeline records and set them to in progress state
            var taskClient = GetTaskClient(this.taskProperties.PlanUri, this.taskProperties.AuthToken);
            var records = await taskClient.GetRecordsAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, this.taskProperties.TimelineId, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);

            var recordsToUpdate = GetTimelineRecordsToUpdate(records);
            foreach (var record in recordsToUpdate)
            {
                record.State = TimelineRecordState.InProgress;
            }

            await taskClient.UpdateTimelineRecordsAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, this.taskProperties.TimelineId, recordsToUpdate, cancellationToken).ConfigureAwait(false);
        }

        public async Task ReportJobCompleted(string message, TaskResult result, CancellationToken cancellationToken)
        {
            var completedEvent = new JobCompletedEvent(this.taskProperties.JobId, result);
            var taskClient = GetTaskClient(this.taskProperties.PlanUri, this.taskProperties.AuthToken);
            await taskClient.RaisePlanEventAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, completedEvent, cancellationToken).ConfigureAwait(false);

            // Find all existing timeline records and close them
            await this.CompleteTimelineRecords(this.taskProperties.ProjectId, this.taskProperties.PlanId, this.taskProperties.HubName, this.taskProperties.TimelineId, result, cancellationToken, taskClient);
        }

        public async Task TryAbandonJob(CancellationToken cancellationToken)
        {
            if (taskProperties == null)
            {
                return;
            }

            try
            {
                var projectId = taskProperties.ProjectId;
                var planId = taskProperties.PlanId;
                var vstsPlanUrl = taskProperties.PlanUri;
                var authToken = taskProperties.AuthToken;
                var jobId = taskProperties.JobId;
                var hubName = taskProperties.HubName;
                var taskHttpClient = GetTaskClient(vstsPlanUrl, authToken);
                var completedEvent = new JobCompletedEvent(jobId, TaskResult.Abandoned);
                await taskHttpClient.RaisePlanEventAsync(projectId, hubName, planId, completedEvent, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception)
            {
                // yes this really is a horrible best effort that ignores all ex's.
            }
        }

        internal async Task CompleteTimelineRecords(Guid projectId, Guid planId, string hubName, Guid parentTimelineId, TaskResult result, CancellationToken cancellationToken, TaskClient taskClient)
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

        private List<TimelineRecord> GetTimelineRecordsToUpdate(List<TimelineRecord> records)
        {
            return records.Where(rec => rec.Id == this.taskProperties.JobId || rec.ParentId == this.taskProperties.JobId).ToList();
        }

        protected virtual TaskClient GetTaskClient(Uri vstsPlanUrl, string authToken)
        {
            return new TaskClient(vstsPlanUrl, new VssBasicCredential(string.Empty, authToken));
        }
    }
}