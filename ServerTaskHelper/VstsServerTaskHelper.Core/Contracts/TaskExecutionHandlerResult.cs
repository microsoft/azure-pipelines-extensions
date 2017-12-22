using Microsoft.TeamFoundation.DistributedTask.WebApi;

namespace VstsServerTaskHelper.Core.Contracts
{
    public class TaskExecutionHandlerResult : ITaskExecutionHandlerResult
    {
        public TaskResult Result { get; set; }
        public string ErrorMessage { get; set; }
    }
}