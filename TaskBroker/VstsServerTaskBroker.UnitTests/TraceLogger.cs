using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper.UnitTests
{
    public class TraceLogger : ILogger
    {
        public TraceLogger()
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

        public Task HandleEventList(Stream logStream, IDictionary<string, string> eventProperties, CancellationToken cancellationToken)
        {
            eventProperties = eventProperties ?? new Dictionary<string, string>();
            StreamReader reader = new StreamReader(logStream);
            string eventMessages = reader.ReadToEnd();
            this.Events.Add(eventMessages);
            return Task.Run(() => Trace.WriteLine(string.Format("Messages : {0}, Properties: [{1}]", eventMessages, string.Join(";", eventProperties.Select(x => x.Key + "=" + x.Value).ToArray()))), cancellationToken);
        }

        private Task LogTrace(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, string logLevel)
        {
            this.Events.Add(eventName);
            eventProperties = eventProperties ?? new Dictionary<string, string>();
            return Task.Run(() => Trace.WriteLine(string.Format("{3} {0} : {1} [{2}]", eventName, eventMessage, string.Join(";", eventProperties.Select(x => x.Key + "=" + x.Value).ToArray()), logLevel)), cancellationToken);
        }
    }
}