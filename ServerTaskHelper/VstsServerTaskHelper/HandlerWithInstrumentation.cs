using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;

namespace VstsServerTaskHelper
{
    public class HandlerWithInstrumentation<T> : IVstsScheduleHandler<T> 
        where T : VstsMessage
    {
        internal const string HandlerCancelFailedEventName = "HandlerCancelFailed";
        internal const string HandlerExecuteFailedEventName = "HandlerExecuteFailed";
        private readonly ILogger logger;
        private readonly IVstsScheduleHandler<T> baseHandler;

        public HandlerWithInstrumentation(ILogger logger, IVstsScheduleHandler<T> baseHandler)
        {
            this.logger = logger;
            this.baseHandler = baseHandler;
        }

        public async Task<string> Cancel(T vstsMessage, CancellationToken cancellationToken)
        {
            Exception exception;
            try
            {
                await this.logger.LogInfo(vstsMessage.RequestType.ToString(), "Processing request", eventProperties: null, cancellationToken: cancellationToken).ConfigureAwait(false);
                var result = await this.baseHandler.Cancel(vstsMessage, cancellationToken).ConfigureAwait(false);
                await this.logger.LogInfo(vstsMessage.RequestType.ToString(), result, eventProperties: null, cancellationToken: cancellationToken).ConfigureAwait(false);
                return result;
            }
            catch (AggregateException aex)
            {
                exception = aex.InnerExceptions.Count == 1 ? aex.InnerExceptions[0] : aex;
            }
            catch (Exception ex)
            {
                exception = ex;
            }

            // c#6.0 allows await inside catch but this code is not 6.0 yet :-(
            await this.logger.LogException(exception, HandlerCancelFailedEventName, "Failed to handle cancel event", eventProperties: null, cancellationToken: cancellationToken).ConfigureAwait(false);
            throw exception;
        }

        public async Task<VstsScheduleResult> Execute(T vstsMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken)
        {
            // already cancelled?
            var taskClient = GetTaskClient(vstsMessage.VstsUri, vstsMessage.AuthToken, vstsMessage.SkipRaisePlanEvents);
            var buildHttpClientWrapper = GetBuildClient(vstsMessage.VstsUri, vstsMessage.AuthToken);
            var releaseHttpClientWrapper = GetReleaseClient(vstsMessage.VstsPlanUri, vstsMessage.AuthToken);
            var isSessionValid = await JobStatusReportingHelper
                .IsSessionValid(vstsMessage, buildHttpClientWrapper, releaseHttpClientWrapper, cancellationToken)
                .ConfigureAwait(false);
            if (!isSessionValid)
            {
                await this.logger.LogInfo("SessionAlreadyCancelled",
                    string.Format("Skipping Execute for cancelled or deleted {0}", vstsMessage.VstsHub),
                    eventProperties, cancellationToken).ConfigureAwait(false);
                return new VstsScheduleResult{ ScheduleFailed = true};
            }

            // raise assigned event (to signal we got the message)
            var assignedEvent = new JobAssignedEvent(vstsMessage.JobId);
            await taskClient.RaisePlanEventAsync(vstsMessage.ProjectId, vstsMessage.VstsHub.ToString(), vstsMessage.PlanId, assignedEvent, cancellationToken).ConfigureAwait(false);

            // attempt to schedule
            var scheduleResult = await this.Executex(vstsMessage, eventProperties, cancellationToken).ConfigureAwait(false);

            var reportingHelper = GetVstsJobStatusReportingHelper(vstsMessage, this.logger);

            if (scheduleResult.ScheduleFailed)
            {
                // must first call job started, otherwise it cannot be completed
                await reportingHelper.ReportJobStarted(DateTimeOffset.Now, "Started processing job.", CancellationToken.None)
                    .ConfigureAwait(false);
                await reportingHelper.ReportJobCompleted(DateTimeOffset.Now,
                    string.Format("Failed to schedule job. Message: {0}", scheduleResult.Message), false,
                    CancellationToken.None).ConfigureAwait(false);
            }
            else if (vstsMessage.CompleteSychronously)
            {
                // raise completed event
                await reportingHelper
                    .ReportJobCompleted(DateTimeOffset.Now, "Completed processing job.", true, CancellationToken.None)
                    .ConfigureAwait(false);
            }
            return scheduleResult;
        }

        public async Task<VstsScheduleResult> Executex(T vstsMessage, IDictionary<string, string> eventProperties, CancellationToken cancellationToken)
        {
            Exception exception;
            try
            {
                await this.logger.LogInfo(vstsMessage.RequestType.ToString(), "Processing request", eventProperties: null, cancellationToken: cancellationToken);
                var result = await this.baseHandler.Execute(vstsMessage, eventProperties, cancellationToken);

                if (result.ScheduleFailed)
                {
                    await this.logger.LogError(string.Format("{0}_Failed", vstsMessage.RequestType), string.Format("Request failed: {0}", result.Message), eventProperties: null, cancellationToken: cancellationToken);
                }
                else
                {
                    await this.logger.LogInfo(vstsMessage.RequestType.ToString(), string.Format("Processed request: {0}", result.Message), eventProperties: null, cancellationToken: cancellationToken);
                }

                return result;
            }
            catch (AggregateException aex)
            {
                exception = aex.InnerExceptions.Count == 1 ? aex.InnerExceptions[0] : aex;
            }
            catch (Exception ex)
            {
                exception = ex;
            }

            // c#6.0 allows await inside catch but this code is not 6.0 yet :-(
            await this.logger.LogException(exception, HandlerExecuteFailedEventName, "Failed to handle execute event", eventProperties: null, cancellationToken: cancellationToken);
            throw exception;
        }

        protected virtual ITaskClient GetTaskClient(Uri vstsPlanUrl, string authToken, bool skipRaisePlanEvents)
        {
            return TaskClientFactory.GetTaskClient(vstsPlanUrl, authToken, logger, skipRaisePlanEvents);
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