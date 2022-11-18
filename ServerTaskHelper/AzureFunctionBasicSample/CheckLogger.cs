using System;
using System.Net.Http;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.IO;
using System.Net.Http.Headers;
using System.Text;

namespace AzureFunctionBasicSample
{
    /// <summary>
    /// Class <c>CheckLogger</c> logs messages to checks console within pipeline run.
    /// </summary>
    public sealed class CheckLogger
    {

        private CheckLogger() { }

        /// <summary>This is the entry point of checks logging feature.
        /// <param name="httpClient">HttpClient instance</param>
        /// <param name="projectId">ProjectId system variable from request headers: system.TeamProjectId</param>
        /// <param name="authToken">AuthToken system variable from request headers: system.AccessToken</param>
        /// <param name="hubName">HubName system variable from request headers: system.HostType</param>
        /// <param name="planId">PlanId system variable from request headers: system.PlanId</param>
        /// <param name="planUrl">PlanUrl system variable from request headers</param>
        /// <param name="jobId">JobId system variable from request headers: system.JobId</param>
        /// <param name="timelineId">TimelineId system variable from request headers: system.TimelineId</param>
        /// <param name="taskInstanceId">TaskInstanceId system variable from request headers: system.TaskInstanceId</param>
        /// <param name="message">Message logged to the checks console</param>
        /// </summary>
        public static void WriteToCheckConsole(HttpClient httpClient, string planUrl, string projectId, string hubName, string planId, string jobId, string timelineId, string taskInstanceId, string authToken, string message)
        {
            var pagesFolder = Path.Combine(Path.GetTempPath(), "pages");
            Directory.Delete(pagesFolder, true);
            Directory.CreateDirectory(pagesFolder);

            var logFileName = Path.Combine(pagesFolder, $"taskLog.log");
            var pageData = new FileStream(logFileName, FileMode.CreateNew);
            var pageWriter = new StreamWriter(pageData, Encoding.UTF8);

            SendTaskLogFeeds(httpClient, authToken, planUrl, projectId, hubName, planId, jobId, timelineId, message);
            pageWriter.WriteLine(message);
            pageWriter.Flush();
            pageData.Flush();
            pageWriter.Dispose();

            var taskLogObjectString = CreateTaskLog(httpClient, authToken, planUrl, projectId, hubName, planId, taskInstanceId);
            var taskLogObject = JObject.Parse(taskLogObjectString);

            // Append task log data
            AppendToTaskLog(httpClient, authToken, planUrl, projectId, hubName, planId, taskLogObject["id"].Value<string>(), logFileName);

            // Attach task log to the timeline record
            UpdateTaskTimelineRecord(httpClient, authToken, planUrl, projectId, hubName, planId, timelineId, taskInstanceId, taskLogObjectString);
        }

        /// <summary>Method for sending task log feeds.
        /// <example>
        /// Task feed example:
        /// <code>
        /// taskFeedUrl : {planUrl}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/timelines/{timelineId}/records/{jobId}/feed?api-version=4.1
        /// requestBody : { "value": [ "array of log data" ], "count": number of logs } => { "value" : [ "2019-01-04T12:32:42.2042287Z Task started." ],"count" : 1 }
        /// </code>
        /// </example>
        /// </summary>
        private static void SendTaskLogFeeds(HttpClient httpClient, string authToken, string planUrl, string projectId, string hubName, string planId, string jobId, string timelineId, string message)
        {
            const string SendTaskFeedUrl = "{0}/{1}/_apis/distributedtask/hubs/{2}/plans/{3}/timelines/{4}/records/{5}/feed?api-version=4.1";
            var taskFeedUrl = string.Format(SendTaskFeedUrl, planUrl, projectId, hubName, planId, timelineId, jobId);

            JArray array = new()
            {
                message
            };
            var requestBodyJObject = new JObject
            {
                ["value"] = array
            };
            requestBodyJObject.Add(new JProperty("count", 1));
            var requestBody = JsonConvert.SerializeObject(requestBodyJObject);

            httpClient.PostData(taskFeedUrl, requestBody, authToken);
        }

        /// <summary>Method for creating task log.
        /// <example>
        /// Create task log example:
        /// <code>
        /// taskLogCreateUrl : {planUrl}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/logs?api-version=4.1
        /// requestBody : { "path" : "logs\\{taskInstanceId}" } => { "path" : "logs\\3b9c4dc6-1e5d-4379-b16c-6231d7620059" }
        /// </code>
        /// </example>
        /// </summary>
        private static string CreateTaskLog(HttpClient httpClient, string authToken, string planUrl, string projectId, string hubName, string planId, string taskInstanceId)
        {
            var taskLogCreateUrl = $"{planUrl}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/logs?api-version=4.1";
            var requestBodyJObject = new JObject(new JProperty("path", string.Format(@"logs\{0:D}", taskInstanceId)));
            var requestBody = JsonConvert.SerializeObject(requestBodyJObject);
            var taskLogResponse = httpClient.PostData(taskLogCreateUrl, requestBody, authToken).Result;

            return taskLogResponse
                .Content
                .ReadAsStringAsync()
                .Result;
        }

        /// <summary>Method for appending to task log.
        /// <example>
        /// Append to task log example:
        /// <code>
        /// appendTaskLogUrl : {planUrl}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/logs/{taskLogId}?api-version=4.1
        /// requestBody : log messages stream data
        /// </code>
        /// </example>
        /// </summary>
        private static void AppendToTaskLog(HttpClient httpClient, string authToken, string planUrl, string projectId, string hubName, string planId, string taskLogId, string logFilePath)
        {
            var appendTaskLogUrl = $"{planUrl}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/logs/{taskLogId}?api-version=4.1";

            using var fs = File.Open(logFilePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            HttpContent content = new StreamContent(fs);

            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(
            ASCIIEncoding.ASCII.GetBytes(
                string.Format("{0}:{1}", "", authToken))));

            _ = httpClient.PostAsync(new Uri(appendTaskLogUrl), content).Result;
        }

        /// <summary>Method for appending to task log.
        /// <example>
        /// Update timeline record example:
        /// <code>
        /// updateTaskTimelineRecordUrl : {planUrl}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/timelines/{timelineId}/records?api-version=4.1
        /// requestBody : { "value" : [timelineRecords], "count" : 1 }
        /// timelineRecord : { "id" : taskInstanceId, "log" : taskLogObject}
        /// </code>
        /// </example>
        /// </summary>
        private static void UpdateTaskTimelineRecord(HttpClient httpClient, string authToken, string planUrl, string projectId, string hubName, string planId, string timelineId, string taskInstanceId, string taskLogObject)
        {
            var updateTaskTimelineRecordUrl = $"{planUrl}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/timelines/{timelineId}/records?api-version=4.1";

            var timelineRecord = new JObject(new JProperty("Id", taskInstanceId))
            {
                new JProperty("Log", taskLogObject)
            };

            JArray timelineRecords = new()
            {
                timelineRecord
            };
            var requestBodyJObject = new JObject();
            requestBodyJObject["value"] = timelineRecords;
            requestBodyJObject.Add(new JProperty("count", 1));

            var requestBody = JsonConvert.SerializeObject(requestBodyJObject);

            _ = httpClient.PatchData(updateTaskTimelineRecordUrl, requestBody, authToken).Result;
        }
    }
}
