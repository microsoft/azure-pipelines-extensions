using System;
using System.Threading;
using System.Threading.Tasks;
using AzureFunctionBasicHandler.AdoClients;
using DistributedTask.ServerTask.Remote.Common;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using Microsoft.TeamFoundation.DistributedTask.WebApi;

namespace AzureFunctionBasicHandler
{
    public class MyTaskExecutionHandler : ITaskExecutionHandler
    {
        private readonly TaskProperties taskProperties;

        public MyTaskExecutionHandler(TaskProperties taskProperties)
        {
            this.taskProperties = taskProperties;
        }

        public async Task<TaskResult> ExecuteAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken)
        {
            try
            {
                // Step #2: Send a status update to Azure Pipelines that the check started
                await taskLogger.LogImmediately("Check has started.");

                // Step #3: Retrieve pipeline run's Timeline entry
                var buildClient = new BuildClient(taskProperties);
                var timeline = buildClient.GetTimelineByBuildId();

                // Step #4: Check if the Timeline contains a CmdLine task
                var isCmdLineTaskPresent = BuildClient.IsCmdLineTaskPresent(timeline);

                // Step #5: Send a status update with the result of the search
                await taskLogger.LogImmediately($"CmdLine task is present: {isCmdLineTaskPresent}");

                return await Task.FromResult(isCmdLineTaskPresent ? TaskResult.Succeeded : TaskResult.Failed);
            }
            catch (Exception ex)
            {
                await taskLogger.LogImmediately(ex.Message);
                return await Task.FromResult(TaskResult.Failed);
            }
        }

        public void CancelAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken)
        {
        }
    }

    public class MyTaskObject
    {
        public string Name { get; set; }
    }
}
