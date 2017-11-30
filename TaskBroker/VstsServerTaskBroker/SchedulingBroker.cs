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

using VstsServerTaskBroker.Contracts;
using VstsServerTaskBroker.Azure.ServiceBus;

namespace VstsServerTaskBroker
{
    public class SchedulingBroker<T> 
        where T : VstsMessageBase
    {
        private const int MaxExceptionMessageLength = 100;
        
        private IBrokerInstrumentation baseInstrumentation;
        private IVstsScheduleHandler<T> scheduleHandler;
        private SchedulingBrokerSettings settings;
        private IServiceBusQueueMessageListener queueClient;

        public SchedulingBroker(string timeNamePrefix, string workerName, IServiceBusQueueMessageListener queueClient, IBrokerInstrumentation baseInstrumentation, IVstsScheduleHandler<T> scheduleHandler, SchedulingBrokerSettings settings)
        {
            settings.TimeLineNamePrefix = timeNamePrefix;
            settings.WorkerName = workerName;

            this.Intialize(queueClient, baseInstrumentation, scheduleHandler, settings);
        }

        public SchedulingBroker(IServiceBusQueueMessageListener queueClient, IBrokerInstrumentation baseInstrumentation, IVstsScheduleHandler<T> scheduleHandler, SchedulingBrokerSettings settings)
        {
            this.Intialize(queueClient, baseInstrumentation, scheduleHandler, settings);
        }

        private void Intialize(IServiceBusQueueMessageListener queueClient, IBrokerInstrumentation baseInstrumentation, IVstsScheduleHandler<T> scheduleHandler, SchedulingBrokerSettings settings)
        {
            this.settings = settings;
            this.settings.LockRefreshDelayMsecs = settings.LockRefreshDelayMsecs == 0 ? 1 : settings.LockRefreshDelayMsecs;
            this.baseInstrumentation = baseInstrumentation;
            this.scheduleHandler = scheduleHandler;
            this.queueClient = queueClient;
            this.CreateTaskHttpClient = (uri, authToken, instrumentationHandler, skipRaisePlanEvents) => TaskHttpClientWrapperFactory.GetTaskHttpClientWrapper(uri, authToken, instrumentationHandler, skipRaisePlanEvents);
            this.CreateBuildClient = (uri, authToken) => new BuildHttpClientWrapper(uri, new VssBasicCredential(string.Empty, authToken));
            this.CreateReleaseClient = (uri, authToken) => new ReleaseHttpClientWrapper(uri, new VssBasicCredential(string.Empty, authToken));
            this.CreateVstsReportingHelper = (vstsMessage, inst, props) => new VstsReportingHelper(vstsMessage, inst, props);
        }

        public Func<Uri, string, IBrokerInstrumentation, bool, ITaskHttpClient> CreateTaskHttpClient { get; set; }

        public Func<Uri, string, IBuildHttpClientWrapper> CreateBuildClient { get; set; }

        public Func<Uri, string, IReleaseHttpClientWrapper> CreateReleaseClient { get; set; }

        public Func<VstsMessageBase, IBrokerInstrumentation, Dictionary<string, string>, IVstsReportingHelper> CreateVstsReportingHelper { get; set; }
        
        public async Task ReceiveAsync(IBrokeredMessageWrapper message, CancellationToken cancellationToken)
        {
            // setup basic message properties
            var messageStopwatch = Stopwatch.StartNew();
            var eventProperties = ExtractBrokeredMessageProperties(message);
            Exception exception = null;
            T vstsMessage = null;
            try
            {
                // validate & extract
                string errorMessage;
                if (!ExtractMessage(message, out vstsMessage, out errorMessage))
                {
                    await this.DeadLetterMessage(null, message, eventProperties, errorMessage, cancellationToken, "MessageExtractionFailed").ConfigureAwait(false);
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
                return;
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

        internal static bool ExtractMessage(IBrokeredMessageWrapper message, out T vstsMessage, out string validationErrors)
        {
            T extractedMessage = null;
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
                errorMessageBuilder.AppendFormat("{0}ProjectId is empty", hasErrors ? " | " : string.Empty);
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

            // use ScheduleBuildRequesterAlias if RequesterEmail is null or unresolved
            if (string.IsNullOrEmpty(extractedMessage.RequesterEmail) || extractedMessage.RequesterEmail.StartsWith("$("))
            {
                extractedMessage.RequesterEmail = extractedMessage.ScheduleBuildRequesterAlias;
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
                extractedMessage.VstsPlanUrl = extractedMessage.VstsUrl.Replace(".visualstudio.com", ".vsrm.visualstudio.com");
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

        private static IDictionary<string, string> ExtractBrokeredMessageProperties(IBrokeredMessageWrapper message)
        {
            var eventProperties = new Dictionary<string, string>();
            var attemptObject = message.GetProperty(VstsMessageConstants.RetryAttemptPropertyName) ?? (object)"0";
            var attempt = 0;
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
                var parts = extractedMessage.BuildProperties.SourceControlServerUri.Split(new char[] {'/'});
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
                var taskHttpClient = this.CreateTaskHttpClient(vstsPlanUrl, authToken, this.baseInstrumentation, vstsMessage.SkipRaisePlanEvents);
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
            await this.baseInstrumentation.HandleInfoEvent(eventName, "StopTimer", eventProperties, cancellationToken).ConfigureAwait(false);
        }

        private async Task AbandonOrDeadLetterMessage(T vstsMessage, IBrokeredMessageWrapper message, Exception exception, IDictionary<string, string> eventProperties, CancellationToken cancellationToken)
        {
            // best effort to get attempt safely
            var attempt = 0;
            var attemptString = "0";
            eventProperties.TryGetValue(VstsMessageConstants.RetryAttemptPropertyName, out attemptString);
            int.TryParse(attemptString, out attempt);

            var exceptionTypeName = exception.GetType().Name;
            eventProperties[VstsMessageConstants.ErrorMessagePropertyName] = exception.Message.Substring(0, Math.Min(exception.Message.Length, MaxExceptionMessageLength));
            eventProperties[VstsMessageConstants.ErrorTypePropertyName] = exceptionTypeName;

            if (attempt > this.settings.MaxRetryAttempts)
            {
                var errorMessage = string.Format("[{0} exceeded max attempts [{1}]. Last Ex [{2}] {3}", attempt, this.settings.MaxRetryAttempts, exceptionTypeName, exception.Message);
                await this.DeadLetterMessage(vstsMessage, message, eventProperties, errorMessage, cancellationToken, exceptionTypeName).ConfigureAwait(false);
            }
            else
            {
                await this.DelayedAbandon(message, attempt, exception, eventProperties, cancellationToken).ConfigureAwait(false);
            }
        }

        private async Task DelayedAbandon(IBrokeredMessageWrapper message, int attempt, Exception exception, IDictionary<string, string> eventProperties, CancellationToken cancellationToken)
        {
            // exponential backoff
            int delayMsecs = this.settings.AbandonDelayMsecs + (1000 * (int)(Math.Pow(2, Math.Max(0, attempt - 1)) - 1));
            delayMsecs = Math.Min(delayMsecs, this.settings.MaxAbandonDelayMsecs);
            var abandoningMessageDueToException = string.Format("Abandoning message due to exception in [{0}]ms", delayMsecs);
            await this.baseInstrumentation.HandleException(exception, "MessageProcessingException", abandoningMessageDueToException, eventProperties: eventProperties, cancellationToken: cancellationToken).ConfigureAwait(false);

            while (delayMsecs > 0)
            {
                // await message.RenewLockAsync().ConfigureAwait(false);
                await Task.Delay(this.settings.LockRefreshDelayMsecs, cancellationToken);
                delayMsecs -= this.settings.LockRefreshDelayMsecs;
                cancellationToken.ThrowIfCancellationRequested();
            }

            await this.queueClient.AbandonAsync(message.GetLockToken()).ConfigureAwait(false);
        }

        private async Task DeadLetterMessage(T vstsMessage, IBrokeredMessageWrapper message, IDictionary<string, string> eventProperties, string errorMessage, CancellationToken cancellationToken, string eventProperty)
        {
            if (!eventProperties.ContainsKey(VstsMessageConstants.ErrorTypePropertyName))
            {
                eventProperties[VstsMessageConstants.ErrorTypePropertyName] = errorMessage;
            }
            
            await this.TryFailOrchestrationPlan(vstsMessage, cancellationToken).ConfigureAwait(false);
            await this.baseInstrumentation.HandleErrorEvent("DeadLetterMessage", errorMessage, eventProperties, cancellationToken).ConfigureAwait(false);
            await this.queueClient.DeadLetterAsync(message.GetLockToken()).ConfigureAwait(false);
        }

        private async Task ProcessMessage(IBrokeredMessageWrapper message, IVstsScheduleHandler<T> handler, CancellationToken cancellationToken, T vstsMessage, IDictionary<string, string> eventProperties)
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
            var taskHttpClient = this.CreateTaskHttpClient(vstsPlanUrl, authToken, this.baseInstrumentation, vstsMessage.SkipRaisePlanEvents);

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
            var instrumentation = new VstsBrokerInstrumentation(this.baseInstrumentation, taskHttpClient, hubName, projectId, planId, taskLogId, eventProperties, parentTimelineId, timelineRecordId);
            var instrumentedHandler = new HandlerWithInstrumentation<T>(instrumentation, handler);

            // process request
            if (vstsMessage.RequestType == RequestType.Cancel)
            {
                // attempt to cancel
                await instrumentedHandler.Cancel(vstsMessage, cancellationToken).ConfigureAwait(false);
            }
            else
            {
                // already cancelled?
                var buildHttpClientWrapper = this.CreateBuildClient(vstsUrl, authToken);
                var releaseHttpClientWrapper = this.CreateReleaseClient(vstsPlanUrl, authToken);
                var isSessionValid = await VstsReportingHelper.IsSessionValid(vstsMessage, buildHttpClientWrapper, releaseHttpClientWrapper, cancellationToken).ConfigureAwait(false);
                if (!isSessionValid)
                {
                    await this.baseInstrumentation.HandleInfoEvent("SessionAlreadyCancelled", string.Format("Skipping Execute for cancelled or deleted {0}", vstsMessage.VstsHub), eventProperties, cancellationToken).ConfigureAwait(false);
                    return;
                }

                // raise assigned event (to signal we got the message)
                var assignedEvent = new JobAssignedEvent(jobId);
                await taskHttpClient.RaisePlanEventAsync(projectId, hubName, planId, assignedEvent, cancellationToken).ConfigureAwait(false);

                // attempt to schedule
                var scheduleResult = await instrumentedHandler.Execute(vstsMessage, cancellationToken).ConfigureAwait(false);

                var reportingHelper = this.CreateVstsReportingHelper(vstsMessage, instrumentation, new Dictionary<string, string>());

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

        private async Task<TimelineRecord> GetOrCreateTimelineRecord(CancellationToken cancellationToken, ITaskHttpClient taskHttpClient, Guid projectId, Guid planId, Guid jobId, Guid parentTimelineId, string timelineName, string hubName)
        {
            // attempt to find existing
            var records = await taskHttpClient.GetRecordsAsync(projectId, hubName, planId, parentTimelineId, userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);
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
            var taskLog = await taskHttpClient.CreateLogAsync(projectId, hubName, planId, new TaskLog(logsSubtimelineId), userState: null, cancellationToken: cancellationToken).ConfigureAwait(false);

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
            
            await taskHttpClient.UpdateTimelineRecordsAsync(projectId, hubName, planId, parentTimelineId, new List<TimelineRecord> { timelineRecord }, cancellationToken).ConfigureAwait(false);

            return timelineRecord;
        }
    }
}
