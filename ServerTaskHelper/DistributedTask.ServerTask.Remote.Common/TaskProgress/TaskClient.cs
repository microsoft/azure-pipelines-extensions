using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common.Request;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace DistributedTask.ServerTask.Remote.Common.TaskProgress
{
    public class TaskClient : IDisposable
    {
        private readonly TaskProperties taskProperties;
        private TaskHttpClient taskClient;
        private VssConnection vssConnection;
        private int? PlanVersion;

        public TaskClient(TaskProperties taskProperties)
        {
            this.taskProperties = taskProperties;
            var vssBasicCredential = new VssBasicCredential(string.Empty, taskProperties.AuthToken);
            vssConnection = new VssConnection(taskProperties.PlanUri, vssBasicCredential);
            taskClient = vssConnection.GetClient<TaskHttpClient>();
        }

        public async Task ReportTaskAssigned(Guid taskId, CancellationToken cancellationToken)
        {
            var jobId = await GetJobId(this.taskProperties.HubName, this.taskProperties.JobId, taskId);
            taskId = await GetTaskId(this.taskProperties.HubName, taskId);

            var startedEvent = new TaskAssignedEvent(jobId, taskId);
            await taskClient.RaisePlanEventAsync(taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, startedEvent, cancellationToken).ConfigureAwait(false);
        }

        public async Task ReportTaskStarted(Guid taskId, CancellationToken cancellationToken)
        {
            var jobId = await GetJobId(this.taskProperties.HubName, this.taskProperties.JobId, taskId);
            taskId = await GetTaskId(this.taskProperties.HubName, taskId);
            
            var startedEvent = new TaskStartedEvent(jobId, taskId);
            await taskClient.RaisePlanEventAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, startedEvent, cancellationToken).ConfigureAwait(false);
        }

        public async Task ReportTaskProgress(Guid taskId, CancellationToken cancellationToken)
        {
            var records = await taskClient.GetRecordsAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, this.taskProperties.TimelineId, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);
            var taskRecord = records.FirstOrDefault(r => r.Id == taskId);
            taskRecord.State = TimelineRecordState.InProgress;

            await taskClient.UpdateTimelineRecordsAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, this.taskProperties.TimelineId, new List<TimelineRecord> {taskRecord}, cancellationToken).ConfigureAwait(false);
        }

        public async Task ReportTaskCompleted(Guid taskId, TaskResult result, CancellationToken cancellationToken)
        {
            var jobId = await GetJobId(this.taskProperties.HubName, this.taskProperties.JobId, taskId);
            taskId = await GetTaskId(this.taskProperties.HubName, taskId);
            
            var completedEvent = new TaskCompletedEvent(jobId, taskId, result);
            await taskClient.RaisePlanEventAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, completedEvent, cancellationToken).ConfigureAwait(false);
        }

        public async Task UpdateTimelineRecordsAsync(TimelineRecord timelineRecord, CancellationToken cancellationToken)
        {
            await taskClient.UpdateTimelineRecordsAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, this.taskProperties.TimelineId, new List<TimelineRecord> { timelineRecord }, cancellationToken).ConfigureAwait(false);
        }

        public async Task<TaskLog> CreateLogAsync(TaskLog log)
        {
            return await taskClient.CreateLogAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, log).ConfigureAwait(false);
        }

        public async Task<TaskLog> AppendLogContentAsync(int logId, Stream uploadStream)
        {
            return await taskClient.AppendLogContentAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, logId, uploadStream).ConfigureAwait(false);
        }

        public async Task AppendTimelineRecordFeedAsync(IEnumerable<string> lines)
        {
            await taskClient.AppendTimelineRecordFeedAsync(this.taskProperties.ProjectId, this.taskProperties.HubName, this.taskProperties.PlanId, this.taskProperties.TimelineId, this.taskProperties.JobId, lines).ConfigureAwait(false);
        }

        public void Dispose()
        {
            vssConnection?.Dispose();
            taskClient?.Dispose();
            vssConnection = null;
            taskClient = null;
        }

        private async Task<Guid> GetJobId(string hubName, Guid jobId, Guid taskId)
        {
            if (hubName.Equals("Gates", StringComparison.OrdinalIgnoreCase))
            {
                var planVersion = await GetPlanVersion();
                if (planVersion <= 12)
                {
                    return taskId;
                }
            }

            return jobId;
        }

        private async Task<Guid> GetTaskId(string hubName, Guid taskId)
        {
            if (hubName.Equals("Gates", StringComparison.OrdinalIgnoreCase))
            {
                var planVersion = await GetPlanVersion();
                if (planVersion <= 12)
                {
                    return Guid.Empty;
                }
            }

            return taskId;
        }

        private async Task<int> GetPlanVersion()
        {
            if (this.PlanVersion == null)
            {
                var plan = await taskClient.GetPlanAsync(taskProperties.ProjectId, taskProperties.HubName, taskProperties.PlanId);
                PlanVersion = plan.Version;
            }

            return PlanVersion.Value;
        }
    }
}
