using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using VstsServerTaskHelper.Core.Request;
using VstsServerTaskHelper.Core.TaskProgress;

namespace VstsServerTaskHelper.Core
{
    public class ExecutionHandler
    {
        private readonly ITaskExecutionHandler taskExecutionHandler;
        private readonly TaskMessage taskMessage;
        private readonly TaskProperties taskProperties;
        private JobStatusReportingHelper jobStatusReportingHelper;
        private TaskLogger taskLogger;

        public ExecutionHandler(ITaskExecutionHandler taskExecutionHandler, TaskMessage taskMessage)
        {
            this.taskExecutionHandler = taskExecutionHandler;
            this.taskMessage = taskMessage;
        }

        public ExecutionHandler(ITaskExecutionHandler taskExecutionHandler, string taskMessageBody, IDictionary<string, string> taskProperties)
        {
            this.taskProperties = new TaskProperties(taskProperties);
            this.taskExecutionHandler = taskExecutionHandler;
            this.taskMessage = new TaskMessage(taskMessageBody, this.taskProperties);
        }

        public async Task<TaskResult> Execute(CancellationToken cancellationToken)
        {
            var taskResult = TaskResult.Abandoned;
            try
            {
                // create timelinerecord if not provided
                await CreateTaskTimelineRecordIfRequired(cancellationToken);
                // initialize status report helper
                InitializeJobStatusReportingHelper();
                InitializeTaskLogger();
                // report job started
                await jobStatusReportingHelper.ReportJobStarted("Job has started", cancellationToken);
                // start client handler execute
                var executeTask = taskExecutionHandler.ExecuteAsync(taskMessage, taskLogger, cancellationToken);
                await jobStatusReportingHelper.ReportJobProgress("Job is in progress...", cancellationToken).ConfigureAwait(false);
                taskResult = await executeTask;
                // report job completed with status
                await jobStatusReportingHelper.ReportJobCompleted("Job completed", taskResult, cancellationToken);
                taskLogger.End();
                return taskResult;
            }
            catch (Exception e)
            {
                await this.jobStatusReportingHelper.ReportJobCompleted(e.ToString(), taskResult, cancellationToken);
                throw;
            }
        }

        private void InitializeTaskLogger()
        {
            var planHelper = new PlanHelper(taskProperties.PlanUri, new VssBasicCredential(string.Empty, taskProperties.AuthToken),
                taskProperties.ProjectId, taskProperties.HubName, taskProperties.PlanId);
            taskLogger = new TaskLogger(planHelper, taskProperties.TimelineId, taskProperties.JobId, taskProperties.TaskInstanceId);
        }

        private void InitializeJobStatusReportingHelper()
        {
            jobStatusReportingHelper = new JobStatusReportingHelper(taskProperties);
        }

        public void Cancel(TaskLogger taskLogger, CancellationToken cancellationToken)
        {
            taskLogger.Log("ExecutionHandler.Cancel");
        }

        private async Task CreateTaskTimelineRecordIfRequired(CancellationToken cancellationToken)
        {
            if (taskProperties.TaskInstanceId.Equals(Guid.Empty))
            {
                var timelineRecordId = Guid.NewGuid();
                var timelineRecord = new TimelineRecord
                {
                    Id = timelineRecordId,
                    RecordType = "task",
                    Name = taskProperties.TaskInstanceName,
                    Order = 1,
                    StartTime = DateTime.UtcNow,
                    State = TimelineRecordState.Pending,
                    ParentId = taskProperties.JobId,
                };
                var taskClient = GetTaskClient(taskProperties.PlanUri, taskProperties.AuthToken);
                await taskClient.UpdateTimelineRecordsAsync(
                    taskProperties.ProjectId,
                    taskProperties.HubName,
                    taskProperties.PlanId,
                    taskProperties.TimelineId,
                    new List<TimelineRecord> {timelineRecord},
                    cancellationToken);

                this.taskProperties.TaskInstanceId = timelineRecordId;
            }
        }

        protected virtual TaskClient GetTaskClient(Uri vstsPlanUrl, string authToken)
        {
            return new TaskClient(vstsPlanUrl, new VssBasicCredential(string.Empty, authToken));
        }
    }
}