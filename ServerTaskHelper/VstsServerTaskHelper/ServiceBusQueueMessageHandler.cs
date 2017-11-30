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
            T extractedMessage;
            vstsMessage = null;
            validationErrors = null;

            var messageBody = message.GetBody();
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
                validationErrors = string.Format("Failed to de-serialize message with exception: [{0}] : {1}", ex.GetType().Name, ex.Message);
                return false;
            }

            if (extractedMessage == null)
            {
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
                errorMessageBuilder.AppendFormat("{0}VstsUrl is not a valid URI{1}", hasErrors ? " | " : string.Empty, extractedMessage.VstsUrl);
                hasErrors = true;
            }

            extractedMessage.VstsUri = vstsUri;

            // temp hack until we get the correct URL to use from VSTS
            if (!hasErrors && extractedMessage.VstsHub == HubType.Release && (string.IsNullOrEmpty(extractedMessage.VstsPlanUrl) || extractedMessage.VstsPlanUrl.StartsWith("$(")))
            {
                extractedMessage.VstsPlanUrl = extractedMessage.VstsUrl.ToLowerInvariant().Contains("vsrm")
                    ? extractedMessage.VstsUrl
                    : extractedMessage.VstsUrl.Replace(".visualstudio.com", ".vsrm.visualstudio.com");
            }

            Uri vstsPlanUri;
            if (!Uri.TryCreate(extractedMessage.VstsPlanUrl, UriKind.Absolute, out vstsPlanUri))
            {
                errorMessageBuilder.AppendFormat("{0}VstsPlanUrl is not a valid URI{1}", hasErrors ? " | " : string.Empty, extractedMessage.VstsPlanUrl);
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
                    throw new NotSupportedException(string.Format("Hub [{0}] is not suppported", extractedMessage.VstsHub));
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
            var timelineRecordIdObject = message.GetProperty(VstsMessageConstants.TimelineRecordIdPropertyName) ?? string.Empty;

            eventProperties[VstsMessageConstants.RetryAttemptPropertyName] = attempt.ToString();
            eventProperties[VstsMessageConstants.MessageIdPropertyName] = message.GetMessageId();
            eventProperties[VstsMessageConstants.MachineNamePropertyName] = Environment.MachineName;
            eventProperties[VstsMessageConstants.TaskLogIdPropertyName] = taskLogIdObject.ToString();
            eventProperties[VstsMessageConstants.TimelineRecordIdPropertyName] = timelineRecordIdObject.ToString();

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

        private async Task TryFailOrchestrationPlan(T vstsMessage, CancellationToken cancellationToken)
        {
            if (vstsMessage == null)
            {
                return;
            }

            try
            {
                var projectId = vstsMessage.ProjectId;
                var planId = vstsMessage.PlanId;
                var vstsPlanUrl = vstsMessage.VstsPlanUri;
                var authToken = vstsMessage.AuthToken;
                var jobId = vstsMessage.JobId;
                var hubName = vstsMessage.VstsHub.ToString();
                var taskHttpClient = GetTaskClient(vstsPlanUrl, authToken, vstsMessage.SkipRaisePlanEvents);
                var completedEvent = new JobCompletedEvent(jobId, TaskResult.Abandoned);
                await taskHttpClient.RaisePlanEventAsync(projectId, hubName, planId, completedEvent, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception)
            {
                // yes this really is a horrible best effort that ignores all ex's.
            }
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
            
            await this.TryFailOrchestrationPlan(vstsMessage, cancellationToken).ConfigureAwait(false);
            await clientLogger.LogError("DeadLetterMessage", errorMessage, eventProperties, cancellationToken).ConfigureAwait(false);
            await this.queueClient.DeadLetterAsync(message.GetLockToken()).ConfigureAwait(false);
        }

        private async Task ProcessMessage(IServiceBusMessage message, IVstsScheduleHandler<T> handler, CancellationToken cancellationToken, T vstsMessage, IDictionary<string, string> eventProperties)
        {
            // create client
            var projectId = vstsMessage.ProjectId;
            var planId = vstsMessage.PlanId;
            var vstsPlanUrl = vstsMessage.VstsPlanUri;
            var vstsUrl = vstsMessage.VstsUri;
            var authToken = vstsMessage.AuthToken;
            var parentTimelineId = vstsMessage.TimelineId;
            var jobId = vstsMessage.JobId;
            var hubName = vstsMessage.VstsHub.ToString();
            var taskHttpClient = this.GetTaskClient(vstsPlanUrl, authToken, vstsMessage.SkipRaisePlanEvents);

            // create a timeline if required
            var timelineName = string.Format("{0}_{1}", this.settings.TimeLineNamePrefix, jobId.ToString("D"));

            var logIdObject = message.GetProperty(VstsMessageConstants.TaskLogIdPropertyName);
            var timelineRecordIdObject = message.GetProperty(VstsMessageConstants.TimelineRecordIdPropertyName);
            var taskLogId = 0;
            var gotLogId = logIdObject != null && int.TryParse(logIdObject.ToString(), out taskLogId);
            var gotTimelineRecordId = timelineRecordIdObject != null &&
                                   Guid.TryParse(timelineRecordIdObject.ToString(), out var timelineRecordId);
            if (!gotLogId || !gotTimelineRecordId)
            {
                var timelineRecord = await this.GetOrCreateTimelineRecord(cancellationToken, taskHttpClient, projectId, planId, jobId, parentTimelineId, timelineName, hubName).ConfigureAwait(false);
                taskLogId = timelineRecord.Log.Id;
                timelineRecordId = timelineRecord.Id;
            }

            eventProperties[VstsMessageConstants.TaskLogIdPropertyName] = taskLogId.ToString();
            eventProperties[VstsMessageConstants.TimelineRecordIdPropertyName] = timelineRecordId.ToString();
            vstsMessage.TaskLogId = taskLogId;
            vstsMessage.TimelineId = parentTimelineId;
            vstsMessage.TimelineRecordId = timelineRecordId;

            // setup VSTS instrumentation and wrap handler
            var vstsLogger = new VstsLogger(clientLogger, taskHttpClient, hubName, projectId, planId, taskLogId, parentTimelineId, jobId);
            var loggersAggregate = new LoggersAggregate(new List<ILogger> {clientLogger, vstsLogger});
            var instrumentedHandler = new HandlerWithInstrumentation<T>(loggersAggregate, handler);

            // process request
            if (vstsMessage.RequestType == RequestType.Cancel)
            {
                // attempt to cancel
                await instrumentedHandler.Cancel(vstsMessage, cancellationToken).ConfigureAwait(false);
            }
            else
            {
                // already cancelled?
                var buildHttpClientWrapper = GetBuildClient(vstsUrl, authToken);
                var releaseHttpClientWrapper = GetReleaseClient(vstsPlanUrl, authToken);
                var isSessionValid = await JobStatusReportingHelper.IsSessionValid(vstsMessage, buildHttpClientWrapper, releaseHttpClientWrapper, cancellationToken).ConfigureAwait(false);
                if (!isSessionValid)
                {
                    await clientLogger.LogInfo("SessionAlreadyCancelled",
                        string.Format("Skipping Execute for cancelled or deleted {0}", vstsMessage.VstsHub),
                        eventProperties, cancellationToken).ConfigureAwait(false);
                    return;
                }

                // raise assigned event (to signal we got the message)
                var assignedEvent = new JobAssignedEvent(jobId);
                await taskHttpClient.RaisePlanEventAsync(projectId, hubName, planId, assignedEvent, cancellationToken).ConfigureAwait(false);

                // attempt to schedule
                var scheduleResult = await instrumentedHandler.Execute(vstsMessage, cancellationToken).ConfigureAwait(false);

                var reportingHelper = GetVstsJobStatusReportingHelper(vstsMessage, vstsLogger);

                if (scheduleResult.ScheduleFailed)
                {
                    // must first call job started, otherwise it cannot be completed
                    await reportingHelper.ReportJobStarted(DateTimeOffset.Now, "Started processing job.", CancellationToken.None).ConfigureAwait(false);
                    await reportingHelper.ReportJobCompleted(DateTimeOffset.Now, string.Format("Failed to schedule job. Message: {0}", scheduleResult.Message), false, CancellationToken.None).ConfigureAwait(false);
                }
                else if (vstsMessage.CompleteSychronously)
                {
                    // raise completed event
                    await reportingHelper.ReportJobCompleted(DateTimeOffset.Now, "Completed processing job.", true, CancellationToken.None).ConfigureAwait(false);
                }
            }
        }

        private async Task<int> GetOrCreateTaskLogId(IServiceBusMessage message, CancellationToken cancellationToken, ITaskClient taskClient, Guid projectId, Guid planId, Guid jobId, Guid parentTimelineId, string timelineName, string hubName)
        {
            // attempt to find existing
            var records = await taskClient.GetRecordsAsync(projectId, hubName, planId, parentTimelineId, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);
            foreach (var record in records)
            {
                if (string.Equals(record.Name, timelineName, StringComparison.OrdinalIgnoreCase))
                {
                    return record;
                }
            }

            // Create a new timeline
            var subTimelineId = Guid.NewGuid();

            // create a log file
            var logsSubtimelineId = string.Format(@"logs\{0:D}", subTimelineId);
            var taskLog = await taskClient.CreateLogAsync(projectId, hubName, planId, new TaskLog(logsSubtimelineId), userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);

            // create a sub-timeline
            var timelineRecord = new TimelineRecord
            {
                Id = subTimelineId,
                Name = timelineName,
                StartTime = DateTime.UtcNow,
                State = TimelineRecordState.InProgress,
                RecordType = "task", // Record type can be job or task, as we will be dealing only with task here 
                WorkerName = this.settings.WorkerName,
                Order = 1, // The job timeline record must be at order 1
                Log = taskLog,
                ParentId = jobId,
                PercentComplete = 0,
                ErrorCount = 0,
                WarningCount = 0
            };

            await taskClient.UpdateTimelineRecordsAsync(projectId, hubName, planId, parentTimelineId, new List<TimelineRecord> { timelineRecord }, cancellationToken).ConfigureAwait(false);

            return timelineRecord;
        }

        protected virtual ITaskClient GetTaskClient(Uri vstsPlanUrl, string authToken, bool skipRaisePlanEvents)
        {
            return TaskClientFactory.GetTaskClient(vstsPlanUrl, authToken, clientLogger, skipRaisePlanEvents);
        }

        protected virtual IJobStatusReportingHelper GetVstsJobStatusReportingHelper(VstsMessage vstsMessage, ILogger inst)
        {
            return new JobStatusReportingHelper(vstsMessage, inst);
        }

        protected virtual IReleaseClient GetReleaseClient(Uri uri, string authToken)
        {
            return new ReleaseClient(uri, new VssBasicCredential(string.Empty, authToken));
        }

        protected virtual IBuildClient GetBuildClient(Uri uri, string authToken)
        {
            return new BuildClient(uri, new VssBasicCredential(string.Empty, authToken));
        }
    }
}
