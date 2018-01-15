using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using VstsServerTaskHelper.Core.Request;
using VstsServerTaskHelper.Core.TaskProgress;

namespace VstsServerTaskHelper.Core
{
    public class ExecutionHandler
    {
        private readonly ITaskExecutionHandler taskExecutionHandler;
        private readonly TaskMessage taskMessage;
        private readonly TaskProperties taskProperties;
        private TaskClient taskClientHelper;
        private TaskLogger taskLogger;

        public ExecutionHandler(ITaskExecutionHandler taskExecutionHandler, string taskMessageBody, IDictionary<string, string> taskProperties)
            :this(taskExecutionHandler, new TaskMessage(taskMessageBody, taskProperties))
        {
        }

        public ExecutionHandler(ITaskExecutionHandler taskExecutionHandler, TaskMessage taskMessage)
        {
            this.taskExecutionHandler = taskExecutionHandler;
            this.taskMessage = taskMessage;
        }

        public async Task<TaskResult> Execute(CancellationToken cancellationToken)
        {
            var taskResult = TaskResult.Abandoned;
            try
            {
                // create timelinerecord if not provided
                await CreateTaskTimelineRecordIfRequired(cancellationToken);
                taskLogger = new TaskLogger(taskProperties, taskProperties.TimelineId, taskProperties.JobId, taskProperties.TaskInstanceId);
                // initialize status report helper
                taskClientHelper = new TaskClient(taskProperties, taskLogger);

                // report job started
                await taskClientHelper.ReportJobStarted("Job has started", cancellationToken);
                // start client handler execute
                var executeTask = taskExecutionHandler.ExecuteAsync(taskMessage, taskLogger, cancellationToken);
                await taskClientHelper.ReportJobProgress("Job is in progress...", cancellationToken).ConfigureAwait(false);
                taskResult = await executeTask;

                // report job completed with status
                await taskClientHelper.ReportJobCompleted("Job completed", taskResult, cancellationToken);
                taskLogger.End();
                return taskResult;
            }
            catch (Exception e)
            {
                await taskClientHelper.ReportJobCompleted(e.ToString(), taskResult, cancellationToken);
                throw;
            }
        }

        public void Cancel(CancellationToken cancellationToken)
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
                taskClientHelper = new TaskClient(taskProperties, taskLogger);
                await taskClientHelper.UpdateTimelineRecordsAsync(
                    taskProperties.TimelineId,
                    timelineRecord,
                    cancellationToken);

                taskProperties.TaskInstanceId = timelineRecordId;
            }
        }
    }
}