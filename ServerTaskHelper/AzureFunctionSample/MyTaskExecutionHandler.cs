using System;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Newtonsoft.Json;
using AzureFunctionSample;
using System.Linq;

namespace MyAzureFunctionSampleFunctionHandler
{
    public class MyTaskExecutionHandler : ITaskExecutionHandler
    {
        public async Task<TaskResult> ExecuteAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken)
        {
            string message = String.Empty;
            MyAppParameters myAppParameters;
            try
            {
                myAppParameters = JsonConvert.DeserializeObject<MyAppParameters>(taskMessage.GetTaskMessageBody());
                if (String.IsNullOrWhiteSpace(myAppParameters.AgentName)
                    || String.IsNullOrWhiteSpace(myAppParameters.AgentPoolName)
                    || String.IsNullOrWhiteSpace(myAppParameters.AzureSubscriptionClientId)
                    || String.IsNullOrWhiteSpace(myAppParameters.AzureSubscriptionClientSecret)
                    || String.IsNullOrWhiteSpace(myAppParameters.TenantId)
                    || String.IsNullOrWhiteSpace(myAppParameters.ResourceGroupName)
                    || String.IsNullOrWhiteSpace(myAppParameters.PATToken))
                {
                    message = $"Please provide valid values for 'TenantId', 'AzureSubscriptionClientId', 'AzureSubscriptionClientSecret', 'ResourceGroupName', 'AgentPoolName','AgentName' and 'PATToken' in task body.";
                    await taskLogger.Log(message).ConfigureAwait(false);
                    return await Task.FromResult(TaskResult.Failed);
                }
            }
            catch (Exception ex)
            {
                message = $"Task body deseralization failed: {ex}";
                await taskLogger.Log(message).ConfigureAwait(false);
                return await Task.FromResult(TaskResult.Failed);
            }

            try
            {
                // Creates the container in Azure
                await MyApp.CreateContainer(taskLogger, myAppParameters);

                using (var taskClient = new TaskClient(taskMessage.GetTaskProperties()))
                {
                    // set variable
                    var variableName = "ContainerName";
                    await taskClient.SetTaskVariable(taskId: taskMessage.GetTaskProperties().TaskInstanceId, name: variableName, value: "AzPipelineAgent", isSecret: false, cancellationToken: cancellationToken);

                    // get variable
                    var variableValue = taskClient.GetTaskVariable(taskId: taskMessage.GetTaskProperties().TaskInstanceId, name: variableName, cancellationToken: cancellationToken);
                    message = $"Variable name: {variableName} value: {variableValue}";
                    await taskLogger.Log(message).ConfigureAwait(false);
                }
                
                
                return await Task.FromResult(TaskResult.Succeeded);
            }
            catch (Exception ex)
            {
                message = $"MyFunction execution failed: {ex}";
                await taskLogger.Log(message).ConfigureAwait(false);
                return await Task.FromResult(TaskResult.Failed);
            }
        }

        public void CancelAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken)
        {
        }
    }
}