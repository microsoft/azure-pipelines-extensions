using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskBroker
{
    public interface IBrokerInstrumentation
    {
        Task HandleException(Exception ex, string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null);

        Task HandleInfoEvent(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null);

        Task HandleTraceEvent(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null);

        Task HandleErrorEvent(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null);
    }
}