using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;
using VstsServerTaskHelper.Core.Request;

namespace VstsServerTaskHelper.Core.TaskProgress
{
    public class TaskClient
    {
        private readonly TaskProperties taskProperties;
        private readonly TaskLogger taskLogger;
        private readonly TaskHttpClient taskClient;

        public TaskClient(TaskProperties taskProperties, TaskLogger taskLogger)
        {
            this.taskProperties = taskProperties;
            this.taskLogger = taskLogger;
            var vssBasicCredential = new VssBasicCredential(string.Empty, taskProperties.AuthToken);
            var vssConnection = new VssConnection(taskProperties.PlanUri, vssBasicCredential);
            taskClient = vssConnection.GetClient<TaskHttpClient>();
        }

        public async Task ReportJobAssigned(string message, CancellationToken cancellationToken)
        {
            var startedEvent = new JobAssignedEvent(taskProperties.JobId);
            await taskClient.RaisePlanEventAsync(taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, startedEvent, cancellationToken).ConfigureAwait(false);
            this.taskLogger.Log($"Job started: {message}");
        }

        public async Task ReportJobStarted(string message, CancellationToken cancellationToken)
        {
            var startedEvent = new JobStartedEvent(this.taskProperties.JobId);
            await taskClient.RaisePlanEventAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, startedEvent, cancellationToken).ConfigureAwait(false);
            this.taskLogger.Log($"Job started: {message}");
        }

        public async Task ReportJobProgress(string message, CancellationToken cancellationToken)
        {
            this.taskLogger.Log($"Job running: {message}");
            // Find all existing timeline records and set them to in progress state
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
            await taskClient.RaisePlanEventAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, completedEvent, cancellationToken).ConfigureAwait(false);

            // Find all existing timeline records and close them
            await this.CompleteTimelineRecords(this.taskProperties.ProjectId, this.taskProperties.PlanId, this.taskProperties.HubName, this.taskProperties.TimelineId, result, cancellationToken, taskClient);
        }

        public async Task UpdateTimelineRecordsAsync(Guid timelineId, TimelineRecord timelineRecord, CancellationToken cancellationToken)
        {
            await taskClient.UpdateTimelineRecordsAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, timelineId, new List<TimelineRecord> { timelineRecord },
                cancellationToken);
        }

        private async Task CompleteTimelineRecords(Guid projectId, Guid planId, string hubName, Guid parentTimelineId, TaskResult result, CancellationToken cancellationToken, TaskHttpClient taskClient)
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

            await this.taskClient.UpdateTimelineRecordsAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, parentTimelineId, recordsToUpdate, cancellationToken).ConfigureAwait(false);
        }

        private List<TimelineRecord> GetTimelineRecordsToUpdate(List<TimelineRecord> records)
        {
            return records.Where(rec => rec.Id == taskProperties.JobId || rec.ParentId == taskProperties.JobId).ToList();
        }
    }
}