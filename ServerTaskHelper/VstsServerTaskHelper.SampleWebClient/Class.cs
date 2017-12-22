using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using Microsoft.ApplicationInsights;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Client;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace VstsServerTaskHelper.SampleWebClient
{
    class ExecuteObject
    {
        private TelemetryClient _telemetry = new TelemetryClient();

        public readonly string HUBNAME = "release";
        //public readonly static string HUBNAME = "release";

        public string JobId { get; set; }
        public string PlanId { get; set; }
        public string TimelineId { get; set; }
        public string ProjectId { get; set; }
        public string VstsUrl { get; set; }
        public string AuthToken { get; set; }


        public ExecuteObject(string jobId, string planId, string timelineId, string projectId, string vstsUrl, string authToken, string valueHubName)
        {
            this.JobId = jobId;
            this.PlanId = planId;
            this.TimelineId = timelineId;
            this.ProjectId = projectId;
            this.VstsUrl = vstsUrl;
            this.AuthToken = authToken;
            this.HUBNAME = valueHubName;
        }

        public void Execute()
        {
            _telemetry.TrackEvent("ExecuteObject.Execute() Starting execution thread");
            _telemetry.TrackEvent("ExecuteObject.Execute() Job id: " + this.JobId);
            _telemetry.TrackEvent("ExecuteObject.Execute() Plan id: " + this.PlanId);
            _telemetry.TrackEvent("ExecuteObject.Execute() TimelineId: " + this.TimelineId);
            _telemetry.TrackEvent("ExecuteObject.Execute() Project id: " + this.ProjectId);
            _telemetry.TrackEvent("ExecuteObject.Execute() VSTS URL: " + this.VstsUrl);
            _telemetry.TrackEvent("ExecuteObject.Execute() Auth token: " + this.AuthToken);

            // create guids out of strings to be used throughout this method
            var projectGuid = new Guid(this.ProjectId);
            var planGuid = new Guid(this.PlanId);
            var jobGuid = new Guid(this.JobId);
            var timelineGuid = new Guid(this.TimelineId);
            // Today we allow only 1 task to run in a job, so sending jobId works but tomorrow it will be taskId 
            // once we start supporting multiple tasks.
            var taskInstanceGuid = new Guid(this.JobId);

            _telemetry.TrackEvent("ExecuteObject.Execute() Connecting to vsts...");
            // create connection to VSTS
            //var connection = new VssConnection(new Uri(this.VstsUrl), new VssBasicCredential("username", this.AuthToken));
            var connection = new VssConnection(new Uri(this.VstsUrl), new VssClientCredentials());
            _telemetry.TrackEvent("ExecuteObject.Execute() Connected to vsts");

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

            _telemetry.TrackEvent("ExecuteObject.Execute() start doing work by looping");
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
                taskClient.AppendTimelineRecordFeedAsync(projectGuid, HUBNAME, planGuid, plan.Timeline.Id, jobGuid, liveFeedWrapper);
                _telemetry.TrackEvent("ExecuteObject.Execute() sent message for loop: " + i);

                // sleep for 10 seconds simulating a long running work
                //Thread.Sleep(10000);
            }
            _telemetry.TrackEvent("ExecuteObject.Execute() Finished work");

            // finished with long running work, will now send offline logs and then send task complete event back to vsts
            var timeLineRecords = taskClient.GetRecordsAsync(projectGuid, HUBNAME, planGuid, timelineGuid).SyncResult();
            var httpTaskTimeLineRecord = timeLineRecords.FirstOrDefault(record => record.ParentId != null);

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
            _telemetry.TrackEvent("ExecuteObject.Execute() Sent offline log");

            // Send task completion event
            var taskCompletedEvent = new TaskCompletedEvent(jobGuid, taskInstanceGuid, TaskResult.Succeeded);
            taskClient.RaisePlanEventAsync(projectGuid, HUBNAME, planGuid, taskCompletedEvent).SyncResult();
            _telemetry.TrackEvent("ExecuteObject.Execute() finished sending task complete event to vsts");

        }
    }
}
