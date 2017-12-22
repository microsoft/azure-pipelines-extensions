using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using VstsServerTaskHelper.Core.Contracts;
using VstsServerTaskHelper.Core.VstsClients;

namespace VstsServerTaskHelper.Core
{
    public class JobStatusReportingHelper : IJobStatusReportingHelper
    {
        private readonly TaskMessage taskMessage;
        private readonly TaskLogger taskLogger;

        public JobStatusReportingHelper(TaskMessage taskMessage)
        {
            this.taskMessage = taskMessage;
            var planClient = new PlanHelper(taskMessage.PlanUri,
                new VssBasicCredential(string.Empty, taskMessage.AuthToken), taskMessage.ProjectId,
                taskMessage.HubName, taskMessage.PlanId);
            taskLogger = new TaskLogger(planClient, taskMessage.TimelineId, taskMessage.JobId, taskMessage.TaskInstanceId);
        }

        public async Task ReportJobAssigned(string message, CancellationToken cancellationToken)
        {
            var startedEvent = new JobAssignedEvent(this.taskMessage.JobId);
            var taskClient = GetTaskClient(this.taskMessage.PlanUri, this.taskMessage.AuthToken);
            await taskClient.RaisePlanEventAsync(this.taskMessage.ProjectId, this.taskMessage.HubName, this.taskMessage.PlanId, startedEvent, cancellationToken).ConfigureAwait(false);
            this.taskLogger.Log($"Job started: {message}");
        }

        public async Task ReportJobStarted(string message, CancellationToken cancellationToken)
        {
            var startedEvent = new JobStartedEvent(this.taskMessage.JobId);
            var taskClient = GetTaskClient(this.taskMessage.PlanUri, this.taskMessage.AuthToken);
            await taskClient.RaisePlanEventAsync(this.taskMessage.ProjectId, this.taskMessage.HubName, this.taskMessage.PlanId, startedEvent, cancellationToken).ConfigureAwait(false);
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
            var taskClient = GetTaskClient(this.taskMessage.PlanUri, this.taskMessage.AuthToken);
            var records = await taskClient.GetRecordsAsync(this.taskMessage.ProjectId, this.taskMessage.HubName, this.taskMessage.PlanId, this.taskMessage.TimelineId, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);

            var recordsToUpdate = GetTimelineRecordsToUpdate(records);
            foreach (var record in recordsToUpdate)
            {
                record.State = TimelineRecordState.InProgress;
            }

            await taskClient.UpdateTimelineRecordsAsync(this.taskMessage.ProjectId, this.taskMessage.HubName, this.taskMessage.PlanId, this.taskMessage.TimelineId, recordsToUpdate, cancellationToken).ConfigureAwait(false);
        }

        public async Task ReportJobCompleted(string message, ITaskExecutionHandlerResult taskExecutionHandlerResult, CancellationToken cancellationToken)
        {
            var completedEvent = new JobCompletedEvent(this.taskMessage.JobId, taskExecutionHandlerResult.Result);
            var taskClient = GetTaskClient(this.taskMessage.PlanUri, this.taskMessage.AuthToken);
            await taskClient.RaisePlanEventAsync(this.taskMessage.ProjectId, this.taskMessage.HubName, this.taskMessage.PlanId, completedEvent, cancellationToken).ConfigureAwait(false);

            // Find all existing timeline records and close them
            await this.CompleteTimelineRecords(this.taskMessage.ProjectId, this.taskMessage.PlanId, this.taskMessage.HubName, this.taskMessage.TimelineId, taskExecutionHandlerResult.Result, cancellationToken, taskClient);
        }

        public async Task TryAbandonJob(CancellationToken cancellationToken)
        {
            if (taskMessage == null)
            {
                return;
            }

            try
            {
                var projectId = taskMessage.ProjectId;
                var planId = taskMessage.PlanId;
                var vstsPlanUrl = taskMessage.PlanUri;
                var authToken = taskMessage.AuthToken;
                var jobId = taskMessage.JobId;
                var hubName = taskMessage.HubName;
                var taskHttpClient = GetTaskClient(vstsPlanUrl, authToken);
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

        private List<TimelineRecord> GetTimelineRecordsToUpdate(List<TimelineRecord> records)
        {
            if (string.IsNullOrEmpty(this.taskMessage.TaskInstanceName))
            {
                return records.Where(rec => rec.Id == this.taskMessage.JobId || rec.ParentId == this.taskMessage.JobId)
                    .ToList();
            }

            return records.Where(rec => rec.Name != null && rec.Name.Equals(this.taskMessage.TaskInstanceName, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        protected virtual ITaskClient GetTaskClient(Uri vstsPlanUrl, string authToken)
        {
            return new TaskClient(vstsPlanUrl, new VssBasicCredential(string.Empty, authToken));
        }
    }
}