using System;
using System.Collections.Generic;
using System.Net;
using System.Threading;

namespace VstsServerTaskHelper
{
    public class RetryEventHandler : IRetryEventHandler
    {
        private readonly string eventName;
        private readonly IDictionary<string, string> eventProperties; 
        private readonly IBrokerInstrumentation instrumentationHandler;
        
        // List of HTTP transient error codes to retry.
        private readonly HashSet<HttpStatusCode> trasientHttpCodes = new HashSet<HttpStatusCode>()
        {
            HttpStatusCode.GatewayTimeout,
            HttpStatusCode.RequestTimeout,
            HttpStatusCode.ServiceUnavailable,
            HttpStatusCode.Forbidden,
            HttpStatusCode.Unauthorized,
            HttpStatusCode.InternalServerError,
            HttpStatusCode.NotFound,
        };

        private CancellationToken cancellationToken;

        public Func<bool> OnSuccess { get; set; }

        public Func<Exception, bool> OnRetry { get; set; }

        public Func<Exception, bool> OnFail { get; set; }

        public Func<Exception, int, bool> ShouldRetry { get; set; }

        public RetryEventHandler(string eventName, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, IBrokerInstrumentation brokerInstrumentation, HashSet<HttpStatusCode> transientStatusCodes = null)
        {
            this.eventName = eventName;
            this.eventProperties = eventProperties ?? new Dictionary<string, string>();
            this.cancellationToken = cancellationToken;
            instrumentationHandler = brokerInstrumentation;

            if (transientStatusCodes != null)
            {
                this.trasientHttpCodes = transientStatusCodes;
            }
        }

        public void HandleSuccess(int retryCount, long elapsedMilliseconds)
        {
            var eventType = string.Format("{0}_Success", eventName);
            var message = string.Format("Event {0} successful, Retries {1}", eventName, retryCount);

            if (OnSuccess != null)
            {
                OnSuccess.Invoke();
            }

            TraceEvent(eventType, message, retryCount, elapsedMilliseconds);
        }

        public void HandleRetry(Exception ex, int retryCount, long elapsedMilliseconds)
        {
            var eventType = string.Format("{0}_Retry", eventName);
            var message = string.Format("Retry event {0}, Retries {1}, Exception Type {2}", ex.GetType().Name, eventName, ex.GetType());

            if (OnRetry != null)
            {
                OnRetry.Invoke(ex);
            }

            TraceEvent(eventType, message, retryCount, elapsedMilliseconds);
        }

        public void HandleFail(Exception ex, int retryCount, long elapsedMilliseconds)
        {
            var eventType = string.Format("{0}_Failed", eventName);
            var message = string.Format("Event {0} failed, Retries {1}, Exception {2}", ex.GetType().Name, eventName, ex);

            if (OnFail != null)
            {
                OnFail.Invoke(ex);
            }

            TraceEvent(eventType, message, retryCount, elapsedMilliseconds);
        }

        public bool HandleShouldRetry(Exception ex, int retryCount)
        {
            return (ShouldRetry == null) ? IsTrasientException(ex) : ShouldRetry.Invoke(ex, retryCount);
        }

        private void TraceEvent(string eventType, string message, int retryCount, long elapsedMilliseconds)
        {
            if (instrumentationHandler == null)
            {
                return;
            }

            this.eventProperties["DurationMs"] = elapsedMilliseconds.ToString();
            this.eventProperties["RetryAttempt"] = retryCount.ToString();

            instrumentationHandler.HandleInfoEvent(eventType, message, eventProperties, cancellationToken);
        }

        private bool IsTrasientException(Exception e)
        {
            var ex = e as WebException;

            if (ex == null)
            {
                return false;
            }

            var response = ex.Response as HttpWebResponse;
            if (response == null)
            {
                return false;
            }

            return trasientHttpCodes.Contains(response.StatusCode);
        }
    }
}
