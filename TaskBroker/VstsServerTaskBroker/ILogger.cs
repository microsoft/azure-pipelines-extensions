using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper
{
    public interface ILogger
    {
        Task LogException(Exception ex, string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null);

        Task LogInfo(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null);

        Task LogTrace(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null);

        Task LogError(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null);
    }
}