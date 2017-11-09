using System;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskBroker
{
    public interface IVstsReportingHelper
    {
        Task ReportJobStarted(DateTimeOffset offsetTime, string message, CancellationToken cancellationToken);

        Task ReportJobProgress(DateTimeOffset offsetTime, string message, CancellationToken cancellationToken);

        Task ReportJobCompleted(DateTimeOffset offsetTime, string message, bool isPassed, CancellationToken cancellationToken);
    }
}