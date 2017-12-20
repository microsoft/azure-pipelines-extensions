using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using VstsServerTaskHelper.Core.Contracts;

namespace VstsServerTaskHelper.Core
{
    public interface IJobStatusReportingHelper
    {
        Task ReportJobStarted(string message, CancellationToken cancellationToken);

        Task ReportJobProgress(string message, CancellationToken cancellationToken);

        Task ReportJobCompleted(string message, ITaskExecutionHandlerResult taskExecutionHandlerResult, CancellationToken cancellationToken);

        Task TryAbandonJob(CancellationToken cancellationToken);
    }
}