using System;
using System.Collections.Generic;
using System.Threading;

namespace VstsServerTaskBroker
{
    public class RetryEventHandler : IRetryEventHandler
    {
        private readonly string eventName;
        private readonly IDictionary<string, string> eventProperties; 
        private readonly IBrokerInstrumentation instrumentationHandler;
        private CancellationToken cancellationToken;

        public RetryEventHandler(string eventName, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, IBrokerInstrumentation brokerInstrumentation)
        {
            this.eventName = eventName;
            this.eventProperties = eventProperties ?? new Dictionary<string, string>();
            this.cancellationToken = cancellationToken;
            instrumentationHandler = brokerInstrumentation;
        }

        public void Success(int retryCount, long elapsedMilliseconds)
        {
            var message = string.Format("Successful calling {0} event with {1} retries", eventName, retryCount);

            UpdateEventProperties(retryCount, elapsedMilliseconds);

            this.instrumentationHandler.HandleInfoEvent(string.Format("{0}_Success", eventName), message, eventProperties, cancellationToken).ConfigureAwait(false);
        }

        public void Retry(Exception ex, int retryCount, long elapsedMilliseconds)
        {
            var message = string.Format("Got exception {0} and retrying {1} event", ex.GetType().Name, eventName);

            UpdateEventProperties(retryCount, elapsedMilliseconds);

            this.instrumentationHandler.HandleInfoEvent(string.Format("{0}_Retry", eventName), message, eventProperties, cancellationToken).ConfigureAwait(false);
        }

        public void Fail(Exception ex, int retryCount, long elapsedMilliseconds)
        {
            var message = string.Format("Got exception {0} after retrying {1} times", ex.GetType().Name, retryCount);

            UpdateEventProperties(retryCount, elapsedMilliseconds);

            this.instrumentationHandler.HandleInfoEvent(string.Format("{0}_Failed", eventName), message, eventProperties, cancellationToken).ConfigureAwait(false);
        }

        private void UpdateEventProperties(int retryCount, long elapsedMilliseconds)
        {
            this.eventProperties["DurationMs"] = elapsedMilliseconds.ToString();
            this.eventProperties["RetryAttempt"] = retryCount.ToString();
        }
    }
}
