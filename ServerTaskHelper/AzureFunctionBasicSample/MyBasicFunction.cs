using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Microsoft.Extensions.Primitives;
using System.Net.Http.Headers;
using System.Net.Http;
using System.Text;
using System.Net;
using Microsoft.VisualStudio.Services.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.TeamFoundation.Build.WebApi;
using System.Threading;

namespace AzureFunctionBasicSample
{
    public static class MyBasicFunction
    {
        [FunctionName("MyBasicFunction")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            // the following call does not block
#pragma warning disable CS4014 // Because this call is not awaited, execution of the current method continues before the call is completed
            Task.Run(() =>
            {
                ExecuteBasicAzureFunctionLogicAsync(req, log);
            })
            // log errors in case there are some
            .ContinueWith(task => log.LogInformation(task.Exception.Message), TaskContinuationOptions.OnlyOnFaulted)
            // control is kept with the spawned off thread and not returned to the main one
            .ConfigureAwait(false);
#pragma warning restore CS4014 // Because this call is not awaited, execution of the current method continues before the call is completed

            // Step #1: Confirm the receipt of the check payload
            return new OkObjectResult("Long-running job succesfully scheduled!");
        }

        public static void ExecuteBasicAzureFunctionLogicAsync(HttpRequest req, ILogger log)
        {
            var planUrl = req.Headers["PlanUrl"];
            var projectId = req.Headers["ProjectId"];
            var hubName = req.Headers["HubName"];
            var planId = req.Headers["PlanId"];
            var jobId = req.Headers["JobId"];
            var timelineId = req.Headers["TimelineId"];
            var taskInstanceId = req.Headers["TaskinstanceId"];
            var authToken = req.Headers["AuthToken"];
            if (!Int32.TryParse(req.Headers["BuildId"], out int buildId))
            {
                throw new Exception("BuildId parameter is required when creating azure function check!");
            }

            HttpClientHandler handler = new()
            {
                AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
            };
            var httpClient = new HttpClient(handler);

            // Step #2: Send a status update to Azure Pipelines that the check started
            var message = "Check has started.";
            CheckLogger.WriteToCheckConsole(httpClient, planUrl, projectId, hubName, planId, jobId, timelineId, taskInstanceId, authToken, message);

            // Step #3: Retrieve pipeline run's Timeline entry
            var timeline = GetTimelineEntry(httpClient, planUrl, projectId, buildId, authToken);

            // Step #4: Check if the Timeline contains a CmdLine task
            var isCmdLineTaskPresent = IsCmdLineTaskPresent(timeline);

            // Step #5: Send a status update with the result of the search
            message = $"CmdLine task is present: {isCmdLineTaskPresent}";
            CheckLogger.WriteToCheckConsole(httpClient, planUrl, projectId, hubName, planId, jobId, timelineId, taskInstanceId, authToken, message);

            // Step #6: Send a check decision to Azure Pipelines
            var callbackUrl = $"{planUrl}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/events?api-version=2.0-preview.1";

            var reqBody = JsonConvert.SerializeObject(new
            {
                name = "TaskCompleted",
                jobId = jobId.ToString(),
                taskId = taskInstanceId.ToString(),
                result = isCmdLineTaskPresent ? "succeeded" : "failed"
            }).ToString();

            Thread.Sleep(10000);

            SendCheckDecision(httpClient, callbackUrl, reqBody, authToken, log);
        }

        /// <summary>
        /// Step #3: Retrieve pipeline run's Timeline entry
        /// </summary>
        /// <param name="httpClient"></param>
        /// <param name="planUrl"></param>
        /// <param name="projectId"></param>
        /// <param name="buildId"></param>
        /// <param name="authToken"></param>
        /// <returns></returns>
        public static Timeline GetTimelineEntry(HttpClient httpClient, string planUrl, string projectId, int buildId, StringValues authToken)
        {
            var connection = new VssConnection(new Uri(planUrl), new VssBasicCredential(string.Empty, authToken));

            var buildClient = connection
                .GetClient<BuildHttpClient>();

            return buildClient
                .GetBuildTimelineAsync(projectId, buildId)
                .Result;
        }

        /// <summary>
        /// Step #4: Check if the Timeline contains a CmdLine task
        /// </summary>
        /// <param name="timeline"></param>
        /// <returns></returns>
        public static bool IsCmdLineTaskPresent(Timeline timeline)
        {
            var cmdLineTaskId = new Guid("D9BAFED4-0B18-4F58-968D-86655B4D2CE9");

            var cmdLineTasks = timeline
                .Records
                .FindAll(record => (record.RecordType == "Task") && (record.Task != null) && (StringComparer.OrdinalIgnoreCase.Equals(record.Task.Id, cmdLineTaskId)));
            if (cmdLineTasks?.Count > 0)
            {
                return true;
            }
            return false;
        }

        /// <summary>
        /// Step #6: Callback into Azure DevOps with the check result
        /// </summary>
        /// <param name="httpClient"></param>
        /// <param name="callbackUrl"></param>
        /// <param name="body"></param>
        /// <param name="authToken"></param>
        /// <param name="log"></param>
        public static void SendCheckDecision(HttpClient httpClient, string callbackUrl, string body, StringValues authToken, ILogger log)
        {
            try
            {
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authToken);
                var requestContent = new StringContent(body, Encoding.UTF8, "application/json");
                var response = httpClient.PostAsync(new Uri(callbackUrl), requestContent).Result;
                var responseContent = response.Content.ReadAsStringAsync().Result;
                log.LogInformation(response.StatusCode.ToString());
                log.LogInformation(responseContent);
            }
            catch (Exception ex)
            {
                log.LogError(ex.Message);
            }
        }
    }
}
