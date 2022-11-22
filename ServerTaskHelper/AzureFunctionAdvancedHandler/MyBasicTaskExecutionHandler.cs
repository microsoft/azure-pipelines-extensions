using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using HttpRequestHandler;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Organization.Client;
using Newtonsoft.Json;

namespace AzureFunctionAdvancedSample
{
    internal class MyBasicTaskExecutionHandler : ITaskExecutionHandler
    {
        void ITaskExecutionHandler.CancelAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        async Task<TaskResult> ITaskExecutionHandler.ExecuteAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken)
        {
            // get taskmessage
            // log some values from object
            // return result
            var myObject = JsonConvert.DeserializeObject<MyTaskObject>(taskMessage.GetTaskMessageBody());

            //// Step #2: Send a status update to Azure Pipelines that the check started
            //var message = "Check has started.";
            //await taskLogger.Log(message).ConfigureAwait(false);

            //// Step #3: Retrieve pipeline run's Timeline entry
            //var timeline = GetTimelineEntry(httpClient, planUrl, projectId, buildId, authToken);

            //// Step #4: Check if the Timeline contains a CmdLine task
            //var isCmdLineTaskPresent = IsCmdLineTaskPresent(timeline);

            //// Step #5: Send a status update with the result of the search
            //message = $"CmdLine task is present: {isCmdLineTaskPresent}";
            //CheckLogger.WriteToCheckConsole(httpClient, planUrl, projectId, hubName, planId, jobId, timelineId, taskInstanceId, authToken, message);

            //// Step #6: Send a check decision to Azure Pipelines
            //var callbackUrl = $"{planUrl}/{projectId}/_apis/distributedtask/hubs/{hubName}/plans/{planId}/events?api-version=2.0-preview.1";

            //var reqBody = JsonConvert.SerializeObject(new
            //{
            //    name = "TaskCompleted",
            //    jobId = jobId.ToString(),
            //    taskId = taskInstanceId.ToString(),
            //    result = isCmdLineTaskPresent ? "succeeded" : "failed"
            //}).ToString();
            //Thread.Sleep(10000);

            //SendCheckDecision(httpClient, callbackUrl, reqBody, authToken, log);

            return await Task.FromResult(TaskResult.Succeeded);
        }
    }
}
