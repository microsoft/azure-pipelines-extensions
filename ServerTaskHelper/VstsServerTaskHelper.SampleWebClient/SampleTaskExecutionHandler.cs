using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using VstsServerTaskHelper.Core.Contracts;

namespace VstsServerTaskHelper.SampleWebClient
{
    public class SampleTaskExecutionHandler : ITaskExecutionHandler
    {
        public async Task<ITaskExecutionHandlerResult> ExecuteAsync(ITaskMessage taskMessage, ITaskLogger taskLogger, CancellationToken cancellationToken)
        {
            taskLogger.Log("Inside my sample task execution handler");
            Thread.Sleep(30000);
            return await Task.FromResult(new TaskExecutionHandlerResult { Result = TaskResult.Succeeded });
        }

        public void CancelAsync(ITaskMessage taskMessage, ITaskLogger taskLogger, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}
