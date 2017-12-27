using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Client;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;
using VstsServerTaskHelper.Core.Contracts;
using VstsServerTaskHelper.Core.VstsClients;

namespace VstsServerTaskHelper.Core
{
    public class ExecutionHandler
    {
        private readonly ITaskExecutionHandler taskExecutionHandler;
        private readonly ITaskMessage taskMessage;
        private readonly TaskProperties taskProperties;
        private JobStatusReportingHelper jobStatusReportingHelper;
        private TaskLogger taskLogger;

        public ExecutionHandler(ITaskExecutionHandler taskExecutionHandler, string taskMessageBody, TaskProperties taskProperties)
        {
            this.taskExecutionHandler = taskExecutionHandler;
            this.taskProperties = taskProperties;
            this.taskMessage = new TaskMessage(taskMessageBody, taskProperties);
        }

        public ExecutionHandler(ITaskExecutionHandler taskExecutionHandler, ITaskMessage taskMessage)
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

        public async Task<ITaskExecutionHandlerResult> Execute(CancellationToken cancellationToken)
        {
            ITaskExecutionHandlerResult taskResult = new TaskExecutionHandlerResult {Result = TaskResult.Abandoned};
            try
            {
                // create timelinerecord if not provided
                await CreateTaskTimelineRecordIfRequired(cancellationToken);
                // initialize status report helper
                InitializeJobStatusReportingHelper();
                InitializeTaskLogger();
                // report job started
                await jobStatusReportingHelper.ReportJobStarted("Job has started", cancellationToken);
                var executeTask = taskExecutionHandler.ExecuteAsync(taskMessage, taskLogger, cancellationToken);
                await jobStatusReportingHelper.ReportJobProgress("Job is in progress...", cancellationToken).ConfigureAwait(false);
                // start client handler execute
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

        public async void Execute()
        {
            var HUBNAME = taskProperties.HubName;
            // create guids out of strings to be used throughout this method
            var projectGuid = taskProperties.ProjectId;
            var planGuid = taskProperties.PlanId;
            var jobGuid = taskProperties.JobId;
            var timelineGuid = taskProperties.TimelineId;
            // Today we allow only 1 task to run in a job, so sending jobId works but tomorrow it will be taskId 
            // once we start supporting multiple tasks.
            var taskInstanceGuid = jobGuid;

            //_telemetry.TrackEvent("ExecuteObject.Execute() Connecting to vsts...");
            // create connection to VSTS
            var connection = new VssConnection(taskProperties.PlanUri, new VssClientCredentials());
            //var connection = new VssConnection(taskProperties.PlanUri, new VssBasicCredential("username", taskProperties.AuthToken));
            //_telemetry.TrackEvent("ExecuteObject.Execute() Connected to vsts");

            // get task client
            var taskClient = connection.GetClient<TaskHttpClient>();

            // get the plan
            var plan = taskClient.GetPlanAsync(projectGuid, HUBNAME, planGuid).SyncResult();

            // declare a bunch of variables used in my loop
            var offlineMessageBuilder = new StringBuilder();
            List<string> liveFeedList;
            VssJsonCollectionWrapper<IEnumerable<string>> liveFeedWrapper;
            var message = "doing fake work: ";
            var completeMessage = string.Empty;

            //_telemetry.TrackEvent("ExecuteObject.Execute() start doing work by looping");
            // loop through this 5 times sleeping 10 secods between each loop logging simulate actually doing
            // something and then logging to the live feed about the task progress in VSTS
            for (int i = 0; i < 5; i++)
            {
                // building out message to send to the live feed
                completeMessage = message + i;
                offlineMessageBuilder.Append(completeMessage);
                liveFeedList = new List<string> { completeMessage };
                liveFeedWrapper = new VssJsonCollectionWrapper<IEnumerable<string>>(liveFeedList);

                // sending message to live feed
                await taskClient.AppendTimelineRecordFeedAsync(projectGuid, HUBNAME, planGuid, plan.Timeline.Id, jobGuid, liveFeedWrapper);
                //_telemetry.TrackEvent("ExecuteObject.Execute() sent message for loop: " + i);

                // sleep for 10 seconds simulating a long running work
                //Thread.Sleep(10000);
            }
            //_telemetry.TrackEvent("ExecuteObject.Execute() Finished work");

            // finished with long running work, will now send offline logs and then send task complete event back to vsts
            var timeLineRecords = taskClient.GetRecordsAsync(projectGuid, HUBNAME, planGuid, timelineGuid).SyncResult();
            var httpTaskTimeLineRecord = timeLineRecords.Where(record => record.ParentId != null)
                .FirstOrDefault();

            // Send the offline logs.
            var logPath = string.Format(CultureInfo.InvariantCulture, "logs\\{0:D}", httpTaskTimeLineRecord.Id);
            var tasklog = new TaskLog(logPath);
            var log = taskClient.CreateLogAsync(projectGuid, HUBNAME, planGuid, tasklog).SyncResult();
            using (var ms = new MemoryStream())
            {
                var allBytes = Encoding.UTF8.GetBytes(offlineMessageBuilder.ToString());
                ms.Write(allBytes, 0, allBytes.Length);
                ms.Position = 0;
                taskClient.AppendLogContentAsync(projectGuid, HUBNAME, planGuid, log.Id, ms).SyncResult();
            }
            //_telemetry.TrackEvent("ExecuteObject.Execute() Sent offline log");

            // Send task completion event
            var jobId = HUBNAME.Equals("Gates", StringComparison.OrdinalIgnoreCase)
                ? httpTaskTimeLineRecord.Id
                : jobGuid;
            var taskCompletedEvent = new TaskCompletedEvent(jobId, taskInstanceGuid, TaskResult.Succeeded);
            taskClient.RaisePlanEventAsync(projectGuid, HUBNAME, planGuid, taskCompletedEvent).SyncResult();
            //_telemetry.TrackEvent("ExecuteObject.Execute() finished sending task complete event to vsts");

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

        public void Cancel(ITaskLogger taskLogger, CancellationToken cancellationToken)
        {
            taskLogger.Log("ExecutionHandler.Cancel");
            // create timelinerecord if not provided
            // initialize logger
            // cancel
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

        protected virtual ITaskClient GetTaskClient(Uri vstsPlanUrl, string authToken)
        {
            return new TaskClient(vstsPlanUrl, new VssBasicCredential(string.Empty, authToken));
        }
    }
}