using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper.Core.Contracts
{
    public interface ITaskExecutionHandler
    {
        Task<ITaskExecutionHandlerResult> ExecuteAsync(ITaskLogger taskLogger, CancellationToken cancellationToken);
        void CancelAsync(ITaskLogger taskLogger, CancellationToken cancellationToken);
    }
}