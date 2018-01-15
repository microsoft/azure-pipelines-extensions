using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using VstsServerTaskHelper.Core.Request;
using VstsServerTaskHelper.Core.TaskProgress;

namespace VstsServerTaskHelper.Core
{
    public interface ITaskExecutionHandler
    {
        Task<TaskResult> ExecuteAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken);
        void CancelAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken);
    }
}