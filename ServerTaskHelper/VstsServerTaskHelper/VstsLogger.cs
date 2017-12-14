using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper
{
    public class VstsLogger : ILogger
    {
        private readonly ILogger logger;
        private readonly ITaskClient taskClient;
        private readonly Guid scopeIdentifier;
        private readonly Guid planId;
        private readonly int taskLogId;
        private readonly string hubName;
        private readonly Guid timelineId;
        private readonly Guid timelineRecordId;

        public VstsLogger(ILogger logger, ITaskClient taskClient, string hubName, Guid scopeIdentifier, Guid planId, int taskLogId, Guid timelineId, Guid timelineRecordId)
        {
            this.logger = logger;
            this.taskClient = taskClient;
            this.scopeIdentifier = scopeIdentifier;
            this.planId = planId;
            this.taskLogId = taskLogId;
            this.timelineId = timelineId;
            this.timelineRecordId = timelineRecordId;
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
                //for (int i = 0; i < 100; i++)
                {
                    using (var logStream = GenerateStreamFromString(logMessage))
                    {
                        this.AppendTimelineRecordFeed(taskClient, scopeIdentifier, planId, logMessage, cancellationToken);
                            await taskClient.AppendLogContentAsync(scopeIdentifier, this.hubName, planId, taskLogId, logStream, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);
                    }

                }
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception ex)
            {
                await logger.LogException(ex, "VstsLogAppend",
                    "Failed to append log to VSTS",
                    eventProperties, cancellationToken).ConfigureAwait(false);
            }
        }

        private async void AppendTimelineRecordFeed(ITaskClient taskHttpClient, Guid scopeIdentifier, Guid planId,
            string logMessage, CancellationToken cancellationToken)
        {
            //Web console line is more than 1024 chars, truncate to first 1024 chars
            if (!string.IsNullOrEmpty(logMessage) && logMessage.Length > 1024)
            {
                logMessage = $"{logMessage.Substring(0, 1024)}...";
            }

            await taskHttpClient.AppendTimelineRecordFeedAsync(
                    scopeIdentifier,
                    this.hubName,
                    planId,
                    this.timelineId,
                    this.timelineRecordId,
                    new List<string>
                    {
                        logMessage
                    },
                    cancellationToken: cancellationToken,
                    userState: null)
                .ConfigureAwait(false);
        }
    }
}