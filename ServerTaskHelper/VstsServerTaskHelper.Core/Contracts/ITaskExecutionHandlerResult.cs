using Microsoft.TeamFoundation.DistributedTask.WebApi;

namespace VstsServerTaskHelper.Core.Contracts
{
    public interface ITaskExecutionHandlerResult
    {
        TaskResult Result { get; set; }
    }
}