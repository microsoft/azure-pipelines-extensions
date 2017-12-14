using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Newtonsoft.Json;

namespace VstsServerTaskHelper
{
    public class ServiceBusQueueMessageHandler<T> 
        where T : VstsMessage
    {
        private const int MaxExceptionMessageLength = 100;
        
        private readonly IVstsScheduleHandler<T> scheduleHandler;
        private readonly ServiceBusQueueMessageHandlerSettings settings;
        private readonly IServiceBusQueueMessageListener queueClient;
        private readonly ILogger clientLogger;

        public ServiceBusQueueMessageHandler(IServiceBusQueueMessageListener queueClient, IVstsScheduleHandler<T> scheduleHandler, ServiceBusQueueMessageHandlerSettings settings, ILogger logger)
        {
            this.scheduleHandler = scheduleHandler;
            this.settings = settings;
            this.queueClient = queueClient;
            this.clientLogger = logger;
        }

        public ServiceBusQueueMessageHandler(IServiceBusQueueMessageListener queueClient, IVstsScheduleHandler<T> scheduleHandler, ServiceBusQueueMessageHandlerSettings settings)
            : this(queueClient, scheduleHandler, settings, new NullLogger())
        {
        }

        // extract message
        // if has errors throw, send deadlettermessage, stop servicebus client
        // process message
        public async Task ReceiveAsync(IServiceBusMessage message, CancellationToken cancellationToken)
        {
            // setup basic message properties
            var messageStopwatch = Stopwatch.StartNew();
            var eventProperties = ExtractServiceBusMessageProperties(message);
            Exception exception = null;
            T vstsMessage = null;
            try
            {
                // validate & extract
                string errorMessage;
                if (!ExtractMessage(message, out vstsMessage, out errorMessage))
                {
                    await this.DeadLetterMessage(null, message, eventProperties, errorMessage, cancellationToken).ConfigureAwait(false);
                    await this.StopTimer("MessageExtractionFailed", messageStopwatch, eventProperties, cancellationToken).ConfigureAwait(false);
                    return;
                }

                // merge vsts properties
                foreach (var property in vstsMessage.GetMessageProperties())
                {
                    eventProperties[property.Key] = property.Value;
                }

                // process message
                await this.ProcessMessage(message, this.scheduleHandler, cancellationToken, vstsMessage, eventProperties).ConfigureAwait(false);
                await this.queueClient.CompleteAsync(message.GetLockToken()).ConfigureAwait(false);
                await this.StopTimer("MessageProcessingSucceeded", messageStopwatch, eventProperties, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                exception = ex;
            }

            // c#6.0 allows await inside catch but this code is not 6.0 yet :-(
            if (exception != null)
            {
                await this.StopTimer("MessageProcessingFailed", messageStopwatch, eventProperties, cancellationToken).ConfigureAwait(false);
                await this.AbandonOrDeadLetterMessage(vstsMessage, message, exception, eventProperties, cancellationToken).ConfigureAwait(false);
            }
        }

        internal static bool ExtractMessage(IServiceBusMessage message, out T vstsMessage, out string validationErrors)
        {
            vstsMessage = null;
            validationErrors = null;

            var messageBody = message.GetBody();
            return ExtractMessage(messageBody, ref vstsMessage, ref validationErrors);
        }

        public static bool ExtractMessage(string messageBody, ref T vstsMessage, ref string validationErrors)
        {
            T extractedMessage;
            if (string.IsNullOrEmpty(messageBody))
            {
                validationErrors = "Message with null or empty body is invalid";
                return false;
            }

            try
            {
                extractedMessage = JsonConvert.DeserializeObject<T>(messageBody);
            }
            catch (Exception ex)
            {
                validationErrors = string.Format("Failed to de-serialize message with exception: [{0}] : {1}",
                    ex.GetType().Name, ex.Message);
                return false;
            }

            return ExtractMessage(out vstsMessage, out validationErrors, extractedMessage);
        }

        public static bool ExtractMessage(out T vstsMessage, out string validationErrors, T extractedMessage)
        {
            if (extractedMessage == null)
            {
                vstsMessage = null;
                validationErrors = "Empty message is invalid";
                return false;
            }

            var errorMessageBuilder = new StringBuilder();
            var hasErrors = false;

            if (extractedMessage.ProjectId == Guid.Empty)
            {
                errorMessageBuilder.AppendFormat("{0}ProjectId is empty", string.Empty);
                hasErrors = true;
            }

            if (string.IsNullOrEmpty(extractedMessage.AuthToken))
            {
                errorMessageBuilder.AppendFormat("{0}AuthToken is null", hasErrors ? " | " : string.Empty);
                hasErrors = true;
            }

            if (extractedMessage.JobId == Guid.Empty)
            {
                errorMessageBuilder.AppendFormat("{0}JobId is empty", hasErrors ? " | " : string.Empty);
                hasErrors = true;
            }

            if (extractedMessage.PlanId == Guid.Empty)
            {
                errorMessageBuilder.AppendFormat("{0}PlanId is empty", hasErrors ? " | " : string.Empty);
                hasErrors = true;
            }

            if (string.IsNullOrEmpty(extractedMessage.VstsUrl))
            {
                errorMessageBuilder.AppendFormat("{0}VstsUrl is null", hasErrors ? " | " : string.Empty);
                hasErrors = true;
            }

            // use ScheduleRequesterAlias if RequesterEmail is null or unresolved
            if (string.IsNullOrEmpty(extractedMessage.RequesterEmail) || extractedMessage.RequesterEmail.StartsWith("$("))
            {
                extractedMessage.RequesterEmail = extractedMessage.ScheduleRequesterAlias;
            }

            Uri vstsUri;
            if (!Uri.TryCreate(extractedMessage.VstsUrl, UriKind.Absolute, out vstsUri))
            {
                errorMessageBuilder.AppendFormat("{0}VstsUrl is not a valid URI{1}", hasErrors ? " | " : string.Empty,
                    extractedMessage.VstsUrl);
                hasErrors = true;
            }

            extractedMessage.VstsUri = vstsUri;

            // temp hack until we get the correct URL to use from VSTS
            if (!hasErrors && extractedMessage.VstsHub == HubType.Release &&
                (string.IsNullOrEmpty(extractedMessage.VstsPlanUrl) || extractedMessage.VstsPlanUrl.StartsWith("$(")))
            {
                extractedMessage.VstsPlanUrl = extractedMessage.VstsUrl.ToLowerInvariant().Contains("vsrm")
                    ? extractedMessage.VstsUrl
                    : extractedMessage.VstsUrl.Replace(".visualstudio.com", ".vsrm.visualstudio.com");
            }

            Uri vstsPlanUri;
            if (!Uri.TryCreate(extractedMessage.VstsPlanUrl, UriKind.Absolute, out vstsPlanUri))
            {
                errorMessageBuilder.AppendFormat("{0}VstsPlanUrl is not a valid URI{1}", hasErrors ? " | " : string.Empty,
                    extractedMessage.VstsPlanUrl);
                hasErrors = true;
            }

            extractedMessage.VstsPlanUri = vstsPlanUri;

            switch (extractedMessage.VstsHub)
            {
                case HubType.Build:
                    hasErrors = ValidateAndExtractBuildProperties(extractedMessage, errorMessageBuilder, hasErrors);
                    break;

                case HubType.Release:
                    hasErrors = ValidateReleaseProperties(extractedMessage, errorMessageBuilder, hasErrors);
                    break;

                default:
                    throw new NotSupportedException(String.Format((string) "Hub [{0}] is not suppported",
                        (object) extractedMessage.VstsHub));
            }

            vstsMessage = hasErrors ? null : extractedMessage;
            validationErrors = hasErrors ? errorMessageBuilder.ToString() : null;
            return !hasErrors;
        }

        private static IDictionary<string, string> ExtractServiceBusMessageProperties(IServiceBusMessage message)
        {
            var eventProperties = new Dictionary<string, string>();
            var attemptObject = message.GetProperty(VstsMessageConstants.RetryAttemptPropertyName) ?? "0";
            int attempt;
            int.TryParse(attemptObject.ToString(), out attempt);
            attempt++;

            var taskLogIdObject = message.GetProperty(VstsMessageConstants.TaskLogIdPropertyName) ?? string.Empty;

            eventProperties[VstsMessageConstants.RetryAttemptPropertyName] = attempt.ToString();
            eventProperties[VstsMessageConstants.MessageIdPropertyName] = message.GetMessageId();
            eventProperties[VstsMessageConstants.MachineNamePropertyName] = Environment.MachineName;
            eventProperties[VstsMessageConstants.TaskLogIdPropertyName] = taskLogIdObject.ToString();

            return eventProperties;
        }

        private static bool ValidateAndExtractBuildProperties(T extractedMessage, StringBuilder errorMessageBuilder, bool hasErrors)
        {
            if (extractedMessage.BuildProperties == null)
            {
                errorMessageBuilder.AppendFormat("{0}BuildProperties is null or empty", hasErrors ? " | " : string.Empty);
                return true;
            }

            if (string.IsNullOrEmpty(extractedMessage.BuildProperties.SourceControlServerUri))
            {
                errorMessageBuilder.AppendFormat("{0}SourceControlServerUri is null or empty", hasErrors ? " | " : string.Empty);
                hasErrors = true;
            }
            else
            {
                // extract repo id from sourceControlServerUri
                var parts = extractedMessage.BuildProperties.SourceControlServerUri.Split('/');
                extractedMessage.BuildProperties.RepositoryName = parts[parts.Length - 1];
            }

            return hasErrors;
        }

        private static bool ValidateReleaseProperties(T extractedMessage, StringBuilder errorMessageBuilder, bool hasErrors)
        {
            if (extractedMessage.ReleaseProperties == null)
            {
                errorMessageBuilder.AppendFormat("{0}ReleaseProperties is null or empty", hasErrors ? " | " : string.Empty);
                return true;
            }

            if (string.IsNullOrEmpty(extractedMessage.ReleaseProperties.ReleaseName))
            {
                errorMessageBuilder.AppendFormat("{0}ReleaseName is null or empty", hasErrors ? " | " : string.Empty);
                hasErrors = true;
            }

            if (string.IsNullOrEmpty(extractedMessage.ReleaseProperties.ReleaseDefinitionName))
            {
                errorMessageBuilder.AppendFormat("{0}ReleaseDefinitionName is null or empty", hasErrors ? " | " : string.Empty);
                hasErrors = true;
            }
            
            if (string.IsNullOrEmpty(extractedMessage.ReleaseProperties.ReleaseEnvironmentName))
            {
                errorMessageBuilder.AppendFormat("{0}ReleaseEnvironmentName is null or empty", hasErrors ? " | " : string.Empty);
                hasErrors = true;
            }

            if (extractedMessage.ReleaseProperties.ReleaseId < 0)
            {
                errorMessageBuilder.AppendFormat("{0}ReleaseId is not a positive integer", hasErrors ? " | " : string.Empty);
                hasErrors = true;
            }

            return hasErrors;
        }

        private async Task StopTimer(string eventName, Stopwatch messageStopwatch, IDictionary<string, string> eventProperties, CancellationToken cancellationToken)
        {
            messageStopwatch.Stop();
            eventProperties[VstsMessageConstants.ProcessingTimeMsPropertyName] = messageStopwatch.ElapsedMilliseconds.ToString();
            await clientLogger.LogInfo(eventName, "StopTimer", eventProperties, cancellationToken).ConfigureAwait(false);
        }

        private async Task AbandonOrDeadLetterMessage(T vstsMessage, IServiceBusMessage message, Exception exception, IDictionary<string, string> eventProperties, CancellationToken cancellationToken)
        {
            // best effort to get attempt safely
            int attempt;
            string attemptString;
            eventProperties.TryGetValue(VstsMessageConstants.RetryAttemptPropertyName, out attemptString);
            int.TryParse(attemptString, out attempt);

            var exceptionTypeName = exception.GetType().Name;
            eventProperties[VstsMessageConstants.ErrorMessagePropertyName] = exception.Message.Substring(0, Math.Min(exception.Message.Length, MaxExceptionMessageLength));
            eventProperties[VstsMessageConstants.ErrorTypePropertyName] = exceptionTypeName;

            if (attempt > this.settings.MaxRetryAttempts)
            {
                var errorMessage = string.Format("[{0} exceeded max attempts [{1}]. Last Ex [{2}] {3}", attempt, this.settings.MaxRetryAttempts, exceptionTypeName, exception.Message);
                await this.DeadLetterMessage(vstsMessage, message, eventProperties, errorMessage, cancellationToken).ConfigureAwait(false);
            }
            else
            {
                await this.DelayedAbandon(message, attempt, exception, eventProperties, cancellationToken).ConfigureAwait(false);
            }
        }

        private async Task DelayedAbandon(IServiceBusMessage message, int attempt, Exception exception, IDictionary<string, string> eventProperties, CancellationToken cancellationToken)
        {
            // exponential backoff
            var delayMsecs = this.settings.AbandonDelayMsecs + (1000 * (int)(Math.Pow(2, Math.Max(0, attempt - 1)) - 1));
            delayMsecs = Math.Min(delayMsecs, this.settings.MaxAbandonDelayMsecs);
            var abandoningMessageDueToException = string.Format("Abandoning message due to exception in [{0}]ms", delayMsecs);
            await clientLogger.LogException(exception, "MessageProcessingException", abandoningMessageDueToException, eventProperties, cancellationToken).ConfigureAwait(false);

            while (delayMsecs > 0)
            {
                // await message.RenewLockAsync().ConfigureAwait(false);
                var delay = settings.LockRefreshDelayMsecs == 0 ? 10 : settings.LockRefreshDelayMsecs;
                await Task.Delay(delay, cancellationToken);
                delayMsecs -= delay;
                cancellationToken.ThrowIfCancellationRequested();
            }

            await this.queueClient.AbandonAsync(message.GetLockToken()).ConfigureAwait(false);
        }

        private async Task DeadLetterMessage(T vstsMessage, IServiceBusMessage message, IDictionary<string, string> eventProperties, string errorMessage, CancellationToken cancellationToken)
        {
            if (!eventProperties.ContainsKey(VstsMessageConstants.ErrorTypePropertyName))
            {
                eventProperties[VstsMessageConstants.ErrorTypePropertyName] = errorMessage;
            }
            
            await GetVstsJobStatusReportingHelper(vstsMessage, clientLogger).TryAbandonJob(cancellationToken).ConfigureAwait(false);
            await clientLogger.LogError("DeadLetterMessage", errorMessage, eventProperties, cancellationToken).ConfigureAwait(false);
            await this.queueClient.DeadLetterAsync(message.GetLockToken()).ConfigureAwait(false);
        }

        private async Task ProcessMessage(IServiceBusMessage message, IVstsScheduleHandler<T> handler, CancellationToken cancellationToken, T vstsMessage, IDictionary<string, string> eventProperties)
        {
            // create client
            var taskClient = this.GetTaskClient(vstsMessage.VstsPlanUri, vstsMessage.AuthToken, vstsMessage.SkipRaisePlanEvents);

            // create a timeline if required
            var timelineName = string.Format("{0}_{1}", this.settings.TimeLineNamePrefix, vstsMessage.JobId.ToString("D"));

            var taskLogId = TryGetTaskLogIdFromMessageProperties(message);
            if (taskLogId <= 0)
            {
                taskLogId = await GetOrCreateTaskLogId(cancellationToken, taskClient, vstsMessage.ProjectId, vstsMessage.PlanId, vstsMessage.JobId, vstsMessage.TimelineId, timelineName, vstsMessage.VstsHub.ToString(), this.settings.WorkerName).ConfigureAwait(false);
            }

            eventProperties[VstsMessageConstants.TaskLogIdPropertyName] = taskLogId.ToString();
            vstsMessage.TaskLogId = taskLogId;

            // setup VSTS instrumentation and wrap handler
            var vstsLogger = new VstsLogger(clientLogger, taskClient, vstsMessage.VstsHub.ToString(), vstsMessage.ProjectId, vstsMessage.PlanId, taskLogId, vstsMessage.TimelineId, vstsMessage.JobId);
            var loggersAggregate = new LoggersAggregate(new List<ILogger> {clientLogger, vstsLogger});
            var instrumentedHandler = GetHandlerWithInstrumentation(loggersAggregate, handler);

            // process request
            if (vstsMessage.RequestType == RequestType.Cancel)
            {
                // attempt to cancel
                await instrumentedHandler.Cancel(vstsMessage, cancellationToken).ConfigureAwait(false);
            }
            else
            {
                await instrumentedHandler.Execute(vstsMessage, eventProperties, cancellationToken);
            }
        }

        private static int TryGetTaskLogIdFromMessageProperties(IServiceBusMessage message)
        {
            var logId = 0;
            var logIdObject = message.GetProperty(VstsMessageConstants.TaskLogIdPropertyName);
            if (logIdObject != null)
            {
                int.TryParse(logIdObject.ToString(), out logId);
            }

            return logId;
        }

        public static async Task<int> GetOrCreateTaskLogId(CancellationToken cancellationToken, ITaskClient taskClient, Guid projectId, Guid planId, Guid jobId, Guid parentTimelineId, string timelineName, string hubName, string workerName)
        {
            // attempt to find existing
            var records = await taskClient.GetRecordsAsync(projectId, hubName, planId, parentTimelineId, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);
            var timelineRecord = records.FirstOrDefault(r => string.Equals(r.Name, timelineName, StringComparison.OrdinalIgnoreCase));
            if (timelineRecord != null)
            {
                return timelineRecord.Log.Id;
            }
            
            // Create a new timeline
            var timelineRecordId = Guid.NewGuid();

            // create a log file
            var logPath = string.Format(@"logs\{0:D}", timelineRecordId);
            var taskLog = new TaskLog(logPath);
            var taskLogReference = await taskClient.CreateLogAsync(projectId, hubName, planId, taskLog, null, cancellationToken).ConfigureAwait(false);

            // create a sub-timeline
            timelineRecord = new TimelineRecord
            {
                Id = timelineRecordId,
                Name = timelineName,
                StartTime = DateTime.UtcNow,
                State = TimelineRecordState.InProgress,
                RecordType = "task", // Record type can be job or task, as we will be dealing only with task here 
                WorkerName = workerName,
                Order = 1, // The job timeline record must be at order 1
                Log = taskLogReference,
                ParentId = jobId,
                PercentComplete = 0,
                ErrorCount = 0,
                WarningCount = 0
            };

            await taskClient.UpdateTimelineRecordsAsync(projectId, hubName, planId, parentTimelineId, new List<TimelineRecord> {timelineRecord}, cancellationToken).ConfigureAwait(false);

            // save the taskLogId on the message

            return timelineRecord.Log.Id;
        }

        protected virtual ITaskClient GetTaskClient(Uri vstsPlanUrl, string authToken, bool skipRaisePlanEvents)
        {
            return TaskClientFactory.GetTaskClient(vstsPlanUrl, authToken, clientLogger, skipRaisePlanEvents);
        }

        protected virtual IJobStatusReportingHelper GetVstsJobStatusReportingHelper(VstsMessage vstsMessage, ILogger logger)
        {
            return new JobStatusReportingHelper(vstsMessage, logger);
        }

        protected virtual IReleaseClient GetReleaseClient(Uri uri, string authToken)
        {
            return new ReleaseClient(uri, new VssBasicCredential(string.Empty, authToken));
        }

        protected virtual IBuildClient GetBuildClient(Uri uri, string authToken)
        {
            return new BuildClient(uri, new VssBasicCredential(string.Empty, authToken));
        }

        protected virtual HandlerWithInstrumentation<T> GetHandlerWithInstrumentation(ILogger loggersAggregate, IVstsScheduleHandler<T> handler)
        {
            return new HandlerWithInstrumentation<T>(loggersAggregate, handler); 
        }
    }
}
