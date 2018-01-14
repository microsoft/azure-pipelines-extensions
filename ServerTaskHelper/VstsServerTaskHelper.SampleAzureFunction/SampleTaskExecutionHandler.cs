using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using VstsServerTaskHelper.Core.Contracts;

namespace VstsServerTaskHelper.SampleAzureFunction
{
    public class SampleTaskExecutionHandler : ITaskExecutionHandler
    {
        public Task<ITaskExecutionHandlerResult> ExecuteAsync(ITaskMessage taskMessage, ITaskLogger taskLogger, CancellationToken cancellationToken)
        {
            taskLogger.Log("Inside my sample task execution handler");

            ITaskExecutionHandlerResult result = new TaskExecutionHandlerResult {Result = TaskResult.Succeeded};
            return Task.FromResult(result);
        }

        public void CancelAsync(ITaskMessage taskMessage, ITaskLogger taskLogger, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}
