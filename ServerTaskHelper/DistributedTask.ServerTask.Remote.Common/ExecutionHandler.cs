using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using Microsoft.TeamFoundation.DistributedTask.WebApi;

namespace DistributedTask.ServerTask.Remote.Common
{
    public class ExecutionHandler
    {
        private readonly ITaskExecutionHandler taskExecutionHandler;
        private readonly TaskMessage taskMessage;
        private readonly TaskProperties taskProperties;
        private TaskLogger taskLogger;

        public ExecutionHandler(ITaskExecutionHandler taskExecutionHandler, string taskMessageBody, IDictionary<string, string> taskProperties)
            :this(taskExecutionHandler, taskMessageBody, new TaskProperties(taskProperties))
        {
        }

        public ExecutionHandler(ITaskExecutionHandler taskExecutionHandler, string taskMessageBody, TaskProperties taskProperties)
        {
            this.taskExecutionHandler = taskExecutionHandler;
            this.taskProperties = taskProperties;
            taskMessage = new TaskMessage(taskMessageBody, taskProperties);
        }

        public async Task<TaskResult> Execute(CancellationToken cancellationToken)
        {
            using (var taskClient = new TaskClient(taskProperties))
            {
                var taskResult = TaskResult.Abandoned;
                try
                {
                    // create timelinerecord if not provided
                    await CreateTaskTimelineRecordIfRequired(taskClient, cancellationToken).ConfigureAwait(false);
                    taskLogger = new TaskLogger(taskProperties, taskClient);

                    // report task started
                    taskLogger.Log("Task started");
                    await taskClient.ReportTaskStarted(taskProperties.TaskInstanceId, cancellationToken).ConfigureAwait(false);
                    // start client handler execute
                    var executeTask = taskExecutionHandler.ExecuteAsync(taskMessage, taskLogger, cancellationToken).ConfigureAwait(false);
                    await taskClient.ReportTaskProgress(taskProperties.TaskInstanceId, cancellationToken).ConfigureAwait(false);
                    taskResult = await executeTask;

                    // report task completed with status
                    taskLogger.Log("Task completed");
                    await taskClient.ReportTaskCompleted(taskProperties.TaskInstanceId, taskResult, cancellationToken).ConfigureAwait(false);
                    await taskLogger.End().ConfigureAwait(false);
                    return taskResult;
                }
                catch (Exception e)
                {
                    taskLogger?.Log(e.ToString());
                    await taskClient.ReportTaskCompleted(taskProperties.TaskInstanceId, taskResult, cancellationToken).ConfigureAwait(false);
                    throw;
                }
            }
        }

        public async Task Cancel(CancellationToken cancellationToken)
        {
            taskLogger.Log("Canceling task ...");
            using (var taskClient = new TaskClient(taskProperties))
            {
                taskLogger = new TaskLogger(taskProperties, taskClient);
                this.taskExecutionHandler.CancelAsync(taskMessage, taskLogger, cancellationToken);
                await taskClient.ReportTaskCompleted(taskProperties.TaskInstanceId, TaskResult.Canceled, cancellationToken).ConfigureAwait(false);
            }
        }

        private async Task CreateTaskTimelineRecordIfRequired(TaskClient taskClient, CancellationToken cancellationToken)
        {
            if (taskProperties.TaskInstanceId.Equals(Guid.Empty))
            {
                taskProperties.TaskInstanceId = Guid.NewGuid();
            }

            var timelineRecord = new TimelineRecord
            {
                Id = taskProperties.TaskInstanceId,
                RecordType = "task",
                Name = taskProperties.TaskInstanceName,
                Order = 1,
                StartTime = DateTime.UtcNow,
                State = TimelineRecordState.Pending,
                ParentId = taskProperties.JobId,
            };

            // this is an upsert call
            await taskClient.UpdateTimelineRecordsAsync(timelineRecord, cancellationToken).ConfigureAwait(false);
        }
    }
}