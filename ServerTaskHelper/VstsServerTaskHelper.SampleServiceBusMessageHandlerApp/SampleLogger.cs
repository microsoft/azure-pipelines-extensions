using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper.SampleServiceBusMessageHandlerApp
{
    public class SampleLogger : ILogger
    {
        public Task LogError(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            eventProperties = eventProperties ?? new Dictionary<string, string>();
            Console.WriteLine(FormatLogMessage(eventName, eventMessage, eventProperties));

            return Task.FromResult<object>(null);
        }

        public Task LogException(Exception ex, string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            eventProperties = eventProperties ?? new Dictionary<string, string>();
            Console.WriteLine(FormatLogMessage(ex.GetType().Name, eventMessage, eventProperties));

            return Task.FromResult<object>(null);
        }

        public Task LogInfo(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            eventProperties = eventProperties ?? new Dictionary<string, string>();
            Console.WriteLine(FormatLogMessage(eventName, eventMessage, eventProperties));

            return Task.FromResult<object>(null);
        }

        public Task LogTrace(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            eventProperties = eventProperties ?? new Dictionary<string, string>();
            Console.WriteLine(FormatLogMessage(eventName, eventMessage, eventProperties));
            return Task.FromResult<object>(null);
        }

        public Task HandleEventList(Stream logStream, IDictionary<string, string> eventProperties, CancellationToken cancellationToken)
        {
            eventProperties = eventProperties ?? new Dictionary<string, string>();
            var reader = new StreamReader(logStream);
            var eventMessages = reader.ReadToEnd();
            Console.WriteLine(FormatLogMessage("EventList", eventMessages, eventProperties));
            return Task.FromResult<object>(null);
        }

        private static string FormatLogMessage(string eventName, string eventMessage, IDictionary<string, string> eventProperties)
        {
            var props = string.Join(",", eventProperties.Select(kv => kv.Key + "=" + kv.Value));
            var message = string.Format("{0}: {1} ({2})", eventName, eventMessage, props);
            return message;
        }
    }
}