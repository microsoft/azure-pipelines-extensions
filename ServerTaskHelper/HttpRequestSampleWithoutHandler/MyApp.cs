using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;

namespace HttpRequestSampleWithoutHandler
{
    internal class MyApp
    {
        /*
        While task execution you can see following logs in pipeline task log UI.

        2019-01-06T13:29:46.8245516Z POST http://localhost:57636/api/mytask
         		Response Code: OK
         		Response: 
        2019-01-06T13:29:47.2478076Z Task Started
        2019-01-06T13:29:47.2478595Z Message 0
        2019-01-06T13:29:48.2896346Z Message 1
        2019-01-06T13:29:49.3278869Z Message 2
        2019-01-06T13:29:50.3780603Z Message 3
        2019-01-06T13:29:51.4158194Z Message 4
        2019-01-06T13:29:52.4514848Z Message 5
        2019-01-06T13:29:53.4912485Z Message 6
        2019-01-06T13:29:54.5305565Z Message 7
        2019-01-06T13:29:55.5703345Z Message 8
        2019-01-06T13:29:56.6087177Z Message 9
        2019-01-06T13:29:57.6914822Z Task Completed
         */

        internal static void ExecuteAsync(string taskMessageBody, string projectId, string planUri, string hubName, string planId, string jobId, string timelineId, string taskInstanceId, string taskInstanceName, string authToken)
        {
            // Instead of sending logs each time, batch the logs and send the logs.
            // see https://github.com/Microsoft/azure-pipelines-extensions/blob/master/ServerTaskHelper/DistributedTask.ServerTask.Remote.Common/TaskProgress/TaskLogger.cs to send logs in batches.
            var pagesFolder = Path.Combine(Path.GetTempPath(), "pages");
            Directory.Delete(pagesFolder, true);
            Directory.CreateDirectory(pagesFolder);
            var logFileName = Path.Combine(pagesFolder, $"taskLog.log");
            var pageData = new FileStream(logFileName, FileMode.CreateNew);
            var pageWriter = new StreamWriter(pageData, System.Text.Encoding.UTF8);

            using (var httpClient = new HttpClient())
            {
                try
                {
                    // Send task started event
                    SendTaskStartedEvent(httpClient, authToken, planUri, projectId, hubName, planId, jobId, taskInstanceId);

                    // send task started message feed and log the message. You will see feed messages in task log UI.
                    SendTaskLogFeeds(httpClient, authToken, planUri, projectId, hubName, planId, jobId, timelineId, "Task Started");
                    pageWriter.WriteLine($"{DateTime.UtcNow:O} Task Started");

                    // Do work
                    for (int i = 0; i < 10; i++)
                    {
                        var logMessage = $"{DateTime.UtcNow:O} Message {i}";
                        SendTaskLogFeeds(httpClient, authToken, planUri, projectId, hubName, planId, jobId, timelineId, logMessage);
                        pageWriter.WriteLine(logMessage);
                        Thread.Sleep(1000);
                    }

                    // Work completed now send task completed event state to mark task completed with succeeded/failed status
                    SendTaskCompletedEvent(httpClient, authToken, planUri, projectId, hubName, planId, jobId, taskInstanceId, "succeeded");

                    // Log the task completed message
                    pageWriter.WriteLine($"{DateTime.UtcNow:O} Task Completed");
                }
                catch (Exception)
                {
                    // Work completed now send task completed event with status 'failed' to mark task failed
                    SendTaskCompletedEvent(httpClient, authToken, planUri, projectId, hubName, planId, jobId, taskInstanceId, "failed");
                }
                finally
                {
                    // Upload the task logs. Create task log and append the all logs to task log.
                    // Create task log entry
                    var taskLogObjectString = CreateTaskLog(httpClient, authToken, planUri, projectId, hubName, planId, taskInstanceId);
                    var taskLogObject = JObject.Parse(taskLogObjectString);

                    pageWriter.Flush();
                    pageData.Flush();
                    pageWriter.Dispose();

                    // Append task log data
                    AppendToTaskLog(httpClient, authToken, planUri, projectId, hubName, planId, taskLogObject["id"].Value<string>(), logFileName);

                    // Attache task log to the timeline record
                    UpdateTaskTimelineRecord(httpClient, authToken, planUri, projectId, hubName, planId, timelineId, taskInstanceId, taskLogObjectString);
                }
            }
        }

        private static void SendTaskStartedEvent(HttpClient httpClient, string authToken, string planUri, string projectId, string hubName, string planId, string jobId, string taskInstanceId)
        {
            // Task Event example: 
            // url: {planUri}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/events?api-version=2.0-preview.1 
            // body : { "name": "TaskStarted", "taskId": "taskInstanceId", "jobId": "jobId" }

            const string TaskEventsUrl = "{0}/{1}/_apis/distributedtask/hubs/{2}/plans/{3}/events?api-version=2.0-preview.1";

            string taskStartedEventUrl = string.Format(TaskEventsUrl, planUri, projectId, hubName, planId);
            var requestBodyJObject = new JObject(new JProperty("name", "TaskStarted"));
            requestBodyJObject.Add(new JProperty("jobId", jobId));
            requestBodyJObject.Add(new JProperty("taskId", taskInstanceId));
            string requestBody = JsonConvert.SerializeObject(requestBodyJObject);

            PostData(httpClient, taskStartedEventUrl, requestBody, authToken);
        }

        private static void SendTaskCompletedEvent(HttpClient httpClient, string authToken, string planUri, string projectId, string hubName, string planId, string jobId, string taskInstanceId, string result)
        {
            // Task Event example: 
            // url: {planUri}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/events?api-version=2.0-preview.1 
            // body : ex: { "name": "TaskCompleted", "taskId": "taskInstanceId", "jobId": "jobId", "result": "succeeded" }

            const string TaskEventsUrl = "{0}/{1}/_apis/distributedtask/hubs/{2}/plans/{3}/events?api-version=2.0-preview.1";

            var taskCompletedUrl = string.Format(TaskEventsUrl, planUri, projectId, hubName, planId);
            var requestBodyJObject = new JObject(new JProperty("name", "TaskCompleted"));
            requestBodyJObject.Add(new JProperty("result", result));  // succeeded or failed
            requestBodyJObject.Add(new JProperty("jobId", jobId));
            requestBodyJObject.Add(new JProperty("taskId", taskInstanceId));
            var requestBody = JsonConvert.SerializeObject(requestBodyJObject);

            PostData(httpClient, taskCompletedUrl, requestBody, authToken);
        }

        private static void SendTaskLogFeeds(HttpClient httpClient, string authToken, string planUri, string projectId, string hubName, string planId, string jobId, string timeLineId, string message)
        {
            // Task feed example:
            // url : {planUri}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/timelines/{timelineId}/records/{jobId}/feed?api-version=4.1
            // body : {"value":["2019-01-04T12:32:42.2042287Z Task started."],"count":1}

            const string SendTaskFeedUrl = "{0}/{1}/_apis/distributedtask/hubs/{2}/plans/{3}/timelines/{4}/records/{5}/feed?api-version=4.1";

            var taskFeedUrl = string.Format(SendTaskFeedUrl, planUri, projectId, hubName, planId, timeLineId, jobId);

            JArray array = new JArray();
            array.Add(message);
            var requestBodyJObject = new JObject();
            requestBodyJObject["value"] = array;
            requestBodyJObject.Add(new JProperty("count", 1));
            var requestBody = JsonConvert.SerializeObject(requestBodyJObject);
            // request body for task feed { "value": "array of log data", "count": number of logs}, ex: {"value": ["2019-01-04T12:35:49.9198590Z container starting"], "count": 1}

            PostData(httpClient, taskFeedUrl, requestBody, authToken);
        }

        private static string CreateTaskLog(HttpClient httpClient, string authToken, string planUri, string projectId, string hubName, string planId, string taskInstanceId)
        {
            // Create task log
            // url: {planUri}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/logs?api-version=4.1"
            // body: {"path":"logs\\{taskInstanceId}"}, example: {"path":"logs\\3b9c4dc6-1e5d-4379-b16c-6231d7620059"}

            const string CreateTaskLogUrl = "{0}/{1}/_apis/distributedtask/hubs/{2}/plans/{3}/logs?api-version=4.1";

            var taskLogCreateUrl = string.Format(CreateTaskLogUrl, planUri, projectId, hubName, planId);
            var requestBodyJObject = new JObject(new JProperty("path", string.Format(@"logs\{0:D}", taskInstanceId)));
            var requestBody = JsonConvert.SerializeObject(requestBodyJObject);

            return PostData(httpClient, taskLogCreateUrl, requestBody, authToken).Content.ReadAsStringAsync().Result;
        }

        private static void AppendToTaskLog(HttpClient httpClient, string authToken, string planUri, string projectId, string hubName, string planId, string taskLogId, string logFilePath)
        {
            // Append to task log
            // url: {planUri}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/logs/{taskLogId}?api-version=4.1
            // body: log messages stream data

            const string AppendLogContentUrl = "{0}/{1}/_apis/distributedtask/hubs/{2}/plans/{3}/logs/{4}?api-version=4.1";

            var appendTaskLogUrl = string.Format(AppendLogContentUrl, planUri, projectId, hubName, planId, taskLogId);

            using (var fs = File.Open(logFilePath, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                HttpContent content = new StreamContent(fs);

                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(
                System.Text.ASCIIEncoding.ASCII.GetBytes(
                    string.Format("{0}:{1}", "", authToken))));

                var returnData = httpClient.PostAsync(new Uri(appendTaskLogUrl), content).Result;
            }
        }

        private static void UpdateTaskTimelineRecord(HttpClient httpClient, string authToken, string planUri, string projectId, string hubName, string planId, string timelineId, string taskInstanceId, string taskLogObject)
        {
            // Update timeline record
            // url: {planUri}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/timelines/{timelineId}/records?api-version=4.1
            // body: {"value":[timelineRecords],"count":1}
            // timelineRecord : {"id": taskInstanceId, "log": taskLogObject}

            const string UpdateTimelineUrl = "{0}/{1}/_apis/distributedtask/hubs/{2}/plans/{3}/timelines/{4}/records?api-version=4.1";

            var updateTaskTimelineRecordUrl = string.Format(UpdateTimelineUrl, planUri, projectId, hubName, planId, timelineId);

            var timelineRecord = new JObject(new JProperty("Id", taskInstanceId));
            timelineRecord.Add(new JProperty("Log", taskLogObject));

            JArray timelineRecords = new JArray();
            timelineRecords.Add(timelineRecord);
            var requestBodyJObject = new JObject();
            requestBodyJObject["value"] = timelineRecords;
            requestBodyJObject.Add(new JProperty("count", 1));

            var requestBody = JsonConvert.SerializeObject(requestBodyJObject);

            PatchData(httpClient, updateTaskTimelineRecordUrl, requestBody, authToken);
        }
        
        
        private static HttpResponseMessage PostData(HttpClient httpClient, string url, string requestBody, string authToken)
        {
            var buffer = System.Text.Encoding.UTF8.GetBytes(requestBody);
            var byteContent = new ByteArrayContent(buffer);
            byteContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(
            System.Text.ASCIIEncoding.ASCII.GetBytes(
                string.Format("{0}:{1}", "", authToken)))); 

            return httpClient.PostAsync(new Uri(url), byteContent).Result;
        }

        private static HttpResponseMessage PatchData(HttpClient httpClient, string url, string requestBody, string authToken)
        {
            var buffer = System.Text.Encoding.UTF8.GetBytes(requestBody);
            var byteContent = new ByteArrayContent(buffer);
            byteContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(
            System.Text.ASCIIEncoding.ASCII.GetBytes(
                string.Format("{0}:{1}", "", authToken))));

            return httpClient.PatchAsync(new Uri(url), byteContent).Result;
        }
    }
}
