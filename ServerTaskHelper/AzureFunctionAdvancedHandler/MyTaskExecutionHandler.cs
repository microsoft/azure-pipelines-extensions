using System;
using System.Threading;
using System.Threading.Tasks;
using AzureFunctionAdvancedHandler.AdoClients;
using DistributedTask.ServerTask.Remote.Common;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using Microsoft.TeamFoundation.DistributedTask.WebApi;

namespace AzureFunctionAdvancedHandler
{
    internal class MyTaskExecutionHandler : ITaskExecutionHandler
    {
        private readonly TaskProperties taskProperties;

        public MyTaskExecutionHandler(TaskProperties taskProperties)
        {
            this.taskProperties = taskProperties;
        }

        void ITaskExecutionHandler.CancelAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        async Task<TaskResult> ITaskExecutionHandler.ExecuteAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken)
        {
            try
            {
                // Step #2: Send a status update to Azure Pipelines that the check started
                await taskLogger.LogImmediately("Check has started.");

                // Step #3: Retrieve Azure Boards ticket referenced in the commit message that triggered the pipeline run
                var witClient = new WorkItemClient(taskProperties);
                var wit = witClient.GetWorkItemById();

                // Step #4: Check if the ticket is in the `Completed` state
                var isWitCompleted = witClient.IsWorkItemCompleted(wit);

                // Step #5: Sends a status update with the result of the check
                await taskLogger.LogImmediately($"Referenced work item is completed: {isWitCompleted}");

                return await Task.FromResult(isWitCompleted ? TaskResult.Succeeded : TaskResult.Failed);
            }
            catch (Exception ex)
            {
                await taskLogger.LogImmediately(ex.Message);
                return await Task.FromResult(TaskResult.Failed);
            }
        }
    }
}
