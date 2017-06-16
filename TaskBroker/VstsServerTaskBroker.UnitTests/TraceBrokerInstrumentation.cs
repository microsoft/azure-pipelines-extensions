namespace VstsServerTaskBroker.UnitTest
{
    using System;
    using System.Collections.Generic;
    using System.Collections.Specialized;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;

    public class TraceBrokerInstrumentation : IBrokerInstrumentation
    {
        public TraceBrokerInstrumentation()
        {
            this.Events = new List<string>();
        }

        public List<string> Events { get; set; }

        public Task HandleException(Exception ex, string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            this.Events.Add(ex.GetType().Name);
            return this.HandleErrorEvent(eventName, ex.Message, eventProperties, cancellationToken);
        }

        public Task HandleInfoEvent(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            return this.LogTrace(eventName, eventMessage, eventProperties, cancellationToken, "INFO");
        }

        public Task HandleTraceEvent(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            return this.LogTrace(eventName, eventMessage, eventProperties, cancellationToken, "TRACE");
        }

        public Task HandleErrorEvent(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            return this.LogTrace(eventName, eventMessage, eventProperties, cancellationToken, "ERROR");
        }

        private Task LogTrace(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, string logLevel)
        {
            this.Events.Add(eventName);
            eventProperties = eventProperties ?? new Dictionary<string, string>();
            return Task.Run(() => Trace.WriteLine(string.Format("{3} {0} : {1} [{2}]", eventName, eventMessage, string.Join(";", eventProperties.Select(x => x.Key + "=" + x.Value).ToArray()), logLevel)), cancellationToken);
        }
    }
}