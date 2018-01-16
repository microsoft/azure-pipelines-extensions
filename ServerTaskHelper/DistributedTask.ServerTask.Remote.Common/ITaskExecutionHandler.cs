using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using Microsoft.TeamFoundation.DistributedTask.WebApi;

namespace DistributedTask.ServerTask.Remote.Common
{
    public interface ITaskExecutionHandler
    {
        Task<TaskResult> ExecuteAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken);

        void CancelAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken);
    }
}