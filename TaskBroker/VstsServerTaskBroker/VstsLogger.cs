using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper
{
    public class VstsLogger : ILogger
    {
        private readonly IList<ILogger> loggers;
        private readonly ITaskClient taskClient;
        private readonly Guid scopeIdentifier;
        private readonly Guid planId;
        private readonly int taskLogId;
        private readonly string hubName;

        public VstsLogger(IList<ILogger> loggers, ITaskClient taskClient, string hubName, Guid scopeIdentifier, Guid planId, int taskLogId)
        {
            this.loggers = loggers;
            this.taskClient = taskClient;
            this.scopeIdentifier = scopeIdentifier;
            this.planId = planId;
            this.taskLogId = taskLogId;
            this.hubName = hubName;
        }

        public Task LogException(Exception ex, string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            var tasks = new List<Task>
            {
                this.AppendLogAsync(eventMessage, eventProperties, this.taskClient, this.scopeIdentifier, this.planId, this.taskLogId, cancellationToken)
            };

            return Task.WhenAll(tasks);
        }

        public Task LogInfo(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            var tasks = new List<Task>
                        {
                            this.AppendLogAsync(eventMessage, eventProperties, this.taskClient, this.scopeIdentifier, this.planId, this.taskLogId, cancellationToken)
                        };

            return Task.WhenAll(tasks);
        }

        public Task LogTrace(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            // don't log traces to VSTS
            return Task.CompletedTask;
        }

        public Task LogError(string eventName, string eventMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken, DateTime? eventTime = null)
        {
            var tasks = new List<Task>
                        {
                            this.AppendLogAsync(eventMessage, eventProperties, this.taskClient, this.scopeIdentifier, this.planId, this.taskLogId, cancellationToken)
                        };
            return Task.WhenAll(tasks);
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

        private async Task AppendLogAsync(string logMessage, IDictionary<string, string> eventProperties, ITaskClient taskClient, Guid scopeIdentifier, Guid planId, int taskLogId, CancellationToken cancellationToken)
        {
            try
            {
                using (var logStream = GenerateStreamFromString(logMessage))
                {
                    await taskClient.AppendLogContentAsync(scopeIdentifier, this.hubName, planId, taskLogId, logStream, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);
                }
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception ex)
            {
                foreach (var registeredLogger in loggers)
                {
                    await registeredLogger.LogException(ex, "VstsLogAppend",
                        "Failed to append log to VSTS",
                        eventProperties, cancellationToken).ConfigureAwait(false);
                }
            }
        }
    }
}