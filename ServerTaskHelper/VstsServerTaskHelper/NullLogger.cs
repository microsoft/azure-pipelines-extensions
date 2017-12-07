using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper
{
    public class NullLogger : ILogger
    {
        public Task LogException(
            Exception ex,
            string eventName,
            string eventMessage,
            IDictionary<string, string> eventProperties,
            CancellationToken cancellationToken,
            DateTime? eventTime = null)
        {
            return Task.CompletedTask;
        }

        public Task LogInfo(
            string eventName,
            string eventMessage,
            IDictionary<string, string> eventProperties,
            CancellationToken cancellationToken,
            DateTime? eventTime = null)
        {
            return Task.CompletedTask;
        }

        public Task LogTrace(
            string eventName,
            string eventMessage,
            IDictionary<string, string> eventProperties,
            CancellationToken cancellationToken,
            DateTime? eventTime = null)
        {
            return Task.CompletedTask;
        }

        public Task LogError(
            string eventName,
            string eventMessage,
            IDictionary<string, string> eventProperties,
            CancellationToken cancellationToken,
            DateTime? eventTime = null)
        {
            return Task.CompletedTask;
        }
    }
}