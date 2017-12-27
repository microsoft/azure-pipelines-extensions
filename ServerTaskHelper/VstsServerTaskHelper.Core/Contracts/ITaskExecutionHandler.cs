using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper.Core.Contracts
{
    public interface ITaskExecutionHandler
    {
        Task<ITaskExecutionHandlerResult> ExecuteAsync(ITaskMessage taskMessage, ITaskLogger taskLogger, CancellationToken cancellationToken);
        void CancelAsync(ITaskMessage taskMessage, ITaskLogger taskLogger, CancellationToken cancellationToken);
    }
}