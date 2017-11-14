using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper
{
    public class VstsBrokerInstrumentation : IBrokerInstrumentation
    {
        private readonly IBrokerInstrumentation baseInstrumentation;
        private readonly ITaskClient taskClient;
        private readonly Guid scopeIdentifier;
        private readonly Guid planId;
        private readonly int taskLogId;
        private readonly IDictionary<string, string> baseEventProperties;
        private readonly string hubName;

        public VstsBrokerInstrumentation(IBrokerInstrumentation baseInstrumentation, ITaskClient taskClient, string hubName, Guid scopeIdentifier, Guid planId, int taskLogId, IDictionary<string, string> eventProperties)
        {
            this.baseInstrumentation = baseInstrumentation;
            this.taskClient = taskClient;
            this.scopeIdentifier = scopeIdentifier;
            this.planId = planId;
            this.taskLogId = taskLogId;
            this.hubName = hubName;
            this.baseEventProperties = eventProperties ?? new Dictionary<string, string>();
        }

        public Task HandleException(Exception ex, string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            eventProperties = this.MergeProperties(eventProperties);
            var exceptionTypeName = ex.GetType().Name;
            eventProperties["ExceptionName"] = exceptionTypeName;
            var attempt = GetAttempt(eventProperties);
            eventTime = eventTime.HasValue ? eventTime : DateTime.UtcNow;
            var logMessage = string.Format("[{0}] EXCEPTION: {1}: {2} (Attempt: {3}) Details: {4}", eventTime.Value.ToString("o"), exceptionTypeName, eventMessage, attempt, ex.ToString());

            var tasks = new Task[]
                        {
                            this.baseInstrumentation.HandleException(ex, eventName, logMessage, eventProperties, cancellationToken),
                            this.AppendLogAsync(logMessage, eventProperties, this.taskClient, this.scopeIdentifier, this.planId, this.taskLogId, cancellationToken)
                        };

            return Task.WhenAll(tasks);
        }

        public Task HandleInfoEvent(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            eventProperties = this.MergeProperties(eventProperties);
            var attempt = GetAttempt(eventProperties);
            eventTime = eventTime.HasValue ? eventTime : DateTime.UtcNow;
            var logMessage = string.Format("[{0}] INFO: {1}: {2} (Attempt: {3})", eventTime.Value.ToString("o"), eventName, eventMessage, attempt);
            var tasks = new Task[]
                        {
                            this.baseInstrumentation.HandleInfoEvent(eventName, eventMessage, eventProperties, cancellationToken),
                            this.AppendLogAsync(logMessage, eventProperties, this.taskClient, this.scopeIdentifier, this.planId, this.taskLogId, cancellationToken)
                        };

            return Task.WhenAll(tasks);
        }

        public Task HandleTraceEvent(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            // don't log traces to VSTS, just delegate to base
            return this.baseInstrumentation.HandleTraceEvent(eventName, eventMessage, eventProperties, cancellationToken);
        }

        public Task HandleErrorEvent(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            eventProperties = this.MergeProperties(eventProperties);
            var attempt = GetAttempt(eventProperties);
            eventTime = eventTime.HasValue ? eventTime : DateTime.UtcNow;
            var logMessage = string.Format("[{0}] ERROR: {1}: {2} (Attempt: {3})", eventTime.Value.ToString("o"), eventName, eventMessage, attempt);
            var tasks = new Task[]
                        {
                            this.baseInstrumentation.HandleErrorEvent(eventName, eventMessage, eventProperties, cancellationToken),
                            this.AppendLogAsync(logMessage, eventProperties, this.taskClient, this.scopeIdentifier, this.planId, this.taskLogId, cancellationToken)
                        };

            return Task.WhenAll(tasks);
        }

        private static string GetAttempt(IDictionary<string, string> eventProperties)
        {
            string attempt;
            if (!eventProperties.TryGetValue(VstsMessageConstants.RetryAttemptPropertyName, out attempt))
            {
                attempt = "1";
            }

            return attempt;
        }

        // http://stackoverflow.com/questions/1879395/how-to-generate-a-stream-from-a-string
        private static Stream GenerateStreamFromString(string s)
        {
            MemoryStream stream = new MemoryStream();
            StreamWriter writer = new StreamWriter(stream);
            writer.Write(s);
            writer.Flush();
            stream.Position = 0;
            return stream;
        }

        private IDictionary<string, string> MergeProperties(IDictionary<string, string> eventProperties)
        {
            if (eventProperties == null)
            {
                return this.baseEventProperties;
            }

            var updatedProperties = new Dictionary<string, string>(this.baseEventProperties);
            foreach (var eventProperty in eventProperties)
            {
                updatedProperties[eventProperty.Key] = eventProperty.Value;
            }

            return updatedProperties;
        }

        private async Task AppendLogAsync(string logMessage, IDictionary<string, string> eventProperties, ITaskClient taskClient, Guid scopeIdentifier, Guid planId, int taskLogId, CancellationToken cancellationToken)
        {
            Exception exception = null;
            try
            {
                using (var logStream = GenerateStreamFromString(logMessage))
                {
                    var taskLogResponse = await taskClient.AppendLogContentAsync(scopeIdentifier, this.hubName, planId, taskLogId, logStream, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);
                }
            }
            catch (Exception ex)
            {
                exception = ex;
            }

            // c#6.0 allows await inside catch but this code is not 6.0 yet :-(
            if (exception != null && exception.GetType() != typeof(OperationCanceledException))
            {
                await this.baseInstrumentation.HandleException(exception, "VstsLogAppend", "Failed to append log to VSTS", eventProperties, cancellationToken).ConfigureAwait(false);
            }
        }
    }
}