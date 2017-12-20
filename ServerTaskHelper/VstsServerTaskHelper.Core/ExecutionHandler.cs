using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using VstsServerTaskHelper.Core.Contracts;
using VstsServerTaskHelper.Core.VstsClients;

namespace VstsServerTaskHelper.Core
{
    public class ExecutionHandler
    {
        private readonly ITaskExecutionHandler taskExecutionHandler;
        private readonly TaskMessage taskMessage;

        public ExecutionHandler(ITaskExecutionHandler taskExecutionHandler, TaskMessage taskMessage)
        {
            this.taskExecutionHandler = taskExecutionHandler;
            this.taskMessage = taskMessage;
        }

        public ExecutionHandler(ITaskExecutionHandler taskExecutionHandler, IDictionary<string, string> taskProperties)
        {
            this.taskMessage = new TaskMessage(taskProperties);
            this.taskExecutionHandler = taskExecutionHandler;
        }

        public async void Execute(CancellationToken cancellationToken)
        {
            // create timelinerecord if not provided
            await CreateTaskTimelineRecordIfRequired(cancellationToken);
            // initialize status report helper
            var jobStatusReportingHelper = new JobStatusReportingHelper(taskMessage);
            // report job started
            await jobStatusReportingHelper.ReportJobStarted("Job has started", cancellationToken);
            var planHelper = new PlanHelper(taskMessage.PlanUri, new VssBasicCredential(string.Empty, taskMessage.AuthToken), taskMessage.ProjectId, taskMessage.HubName, taskMessage.PlanId);
            var taskLogger = new TaskLogger(planHelper, taskMessage.TimelineId, taskMessage.JobId, taskMessage.TaskInstanceId);
            var executeTask = taskExecutionHandler.ExecuteAsync(taskLogger, cancellationToken);
            await jobStatusReportingHelper.ReportJobProgress("Job is in progress...", cancellationToken).ConfigureAwait(false);
            // start client handler execute
            var taskResult = await executeTask;
            // report job completed with status
            await jobStatusReportingHelper.ReportJobCompleted("Job completed", taskResult, cancellationToken);
            taskLogger.End();
        }

        public void Cancel(ITaskLogger taskLogger, CancellationToken cancellationToken)
        {
            taskLogger.Log("ExecutionHandler.Cancel");
            // create timelinerecord if not provided
            // initialize logger
            // cancel
        }

        private async Task CreateTaskTimelineRecordIfRequired(CancellationToken cancellationToken)
        {
            if (taskMessage.TaskInstanceId.Equals(Guid.Empty))
            {
                var timelineRecordId = Guid.NewGuid();
                var timelineRecord = new TimelineRecord
                {
                    Id = timelineRecordId,
                    RecordType = "task",
                    Name = taskMessage.TaskInstanceName,
                    Order = 1,
                    StartTime = DateTime.UtcNow,
                    State = TimelineRecordState.Pending,
                    ParentId = taskMessage.JobId,
                };
                var taskClient = GetTaskClient(taskMessage.PlanUri, taskMessage.AuthToken);
                await taskClient.UpdateTimelineRecordsAsync(
                    taskMessage.ProjectId,
                    taskMessage.HubName,
                    taskMessage.PlanId,
                    taskMessage.TimelineId,
                    new List<TimelineRecord> {timelineRecord},
                    cancellationToken);

                this.taskMessage.TaskInstanceId = timelineRecordId;
            }
        }

        protected virtual ITaskClient GetTaskClient(Uri vstsPlanUrl, string authToken)
        {
            return new TaskClient(vstsPlanUrl, new VssBasicCredential(string.Empty, authToken));
        }
    }
}