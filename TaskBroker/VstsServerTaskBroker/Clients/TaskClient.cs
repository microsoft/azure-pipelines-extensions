using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace VstsServerTaskHelper
{
    public class TaskClient : ITaskClient
    {
        private const int DefaultRetryCount = 3;
        private const int DefaultRetryIntervalInSeconds = 5;

        private readonly Microsoft.TeamFoundation.DistributedTask.WebApi.TaskHttpClient client;
        private readonly IBrokerInstrumentation instrumentationHandler;
        private readonly string vstsUrl;
        private readonly Retryer retryer;

        public TaskClient(Uri baseUrl, VssCredentials credentials, IBrokerInstrumentation instrumentationHandler)
            : this(baseUrl, credentials, instrumentationHandler, DefaultRetryCount, DefaultRetryIntervalInSeconds)
        {
        }

        public TaskClient(Uri baseUrl, VssCredentials credentials, IBrokerInstrumentation instrumentationHandler, int retryCount, int retryInterval)
        {
            this.client = new Microsoft.TeamFoundation.DistributedTask.WebApi.TaskHttpClient(baseUrl, credentials);
            this.instrumentationHandler = instrumentationHandler;
            this.vstsUrl = baseUrl.ToString();
            this.retryer = Retryer.CreateRetryer(retryCount, TimeSpan.FromSeconds(retryInterval));
        }

        public async Task AppendTimelineRecordFeedAsync(Guid scopeIdentifier, string planType, Guid planId, Guid timelineId, Guid recordId, IEnumerable<string> lines, CancellationToken cancellationToken, object userState)
        {
            var retryEventHandler = GetRetryEventHandler("Vsts_AppendTimelineRecordFeedAsync", scopeIdentifier, planId, cancellationToken);

            await retryer.TryActionAsync(
                async () =>
                {
                    await this.client.AppendTimelineRecordFeedAsync(scopeIdentifier, planType, planId, timelineId, recordId, lines, cancellationToken, userState).ConfigureAwait(false);
                    return true;
                },
                retryEventHandler).ConfigureAwait(false);
        }

        public virtual async Task RaisePlanEventAsync<T>(Guid scopeIdentifier, string planType, Guid planId, T eventData, CancellationToken cancellationToken, object userState = null) 
            where T : JobEvent
        {
            var retryEventHandler = GetRetryEventHandler("Vsts_RaisePlanEventAsync", scopeIdentifier, planId, cancellationToken);

            await retryer.TryActionAsync(
                async () =>
                {
                    await this.client.RaisePlanEventAsync(scopeIdentifier, planType, planId, eventData, cancellationToken, userState).ConfigureAwait(false);
                    return true;
                },
                retryEventHandler).ConfigureAwait(false);
        }

        public async Task<List<TimelineRecord>> UpdateTimelineRecordsAsync(Guid scopeIdentifier, string planType, Guid planId, Guid timelineId, IEnumerable<TimelineRecord> records, CancellationToken cancellationToken, object userState = null)
        {
            var retryEventHandler = GetRetryEventHandler("Vsts_UpdateTimelineRecordsAsync", scopeIdentifier, planId, cancellationToken);

            return await retryer.TryActionAsync(
                async () => await this.client.UpdateTimelineRecordsAsync(scopeIdentifier, planType, planId, timelineId, records, cancellationToken, userState).ConfigureAwait(false),
                retryEventHandler).ConfigureAwait(false);
        }

        public async Task<TaskLog> CreateLogAsync(Guid scopeIdentifier, string hubName, Guid planId, TaskLog log, object userState, CancellationToken cancellationToken)
        {
            var retryEventHandler = GetRetryEventHandler("Vsts_CreateLogAsync", scopeIdentifier, planId, cancellationToken);

            return await retryer.TryActionAsync(
                async () => await this.client.CreateLogAsync(scopeIdentifier, hubName, planId, log, userState, cancellationToken).ConfigureAwait(false),
                retryEventHandler).ConfigureAwait(false);
        }

        public async Task<List<TimelineRecord>> GetRecordsAsync(Guid scopeIdentifier, string hubName, Guid planId, Guid timelineId, object userState, CancellationToken cancellationToken)
        {
            var retryEventHandler = GetRetryEventHandler("Vsts_GetRecordsAsync", scopeIdentifier, planId, cancellationToken);

            // Retry for exceptions like VssServiceResponseException - Internal server error
            retryEventHandler.ShouldRetry = (e, count) => (e is VssServiceResponseException || e is NotSupportedException); 

            List<TimelineRecord> records = await this.retryer.TryActionAsync(
                async () =>
                {
                    var timelineRecords = await this.client.GetRecordsAsync(scopeIdentifier, hubName, planId, timelineId, null, userState, cancellationToken).ConfigureAwait(false);

                    // If it has no time line records then retry the get records async call
                    if (timelineRecords.Count == 0)
                    {
                        throw new NotSupportedException("Having no time line records is not supported");
                    }

                    return timelineRecords;
                },
                retryEventHandler).ConfigureAwait(false);

            return records;
        }

        public virtual async Task<TaskLog> AppendLogContentAsync(Guid scopeIdentifier, string hubName, Guid planId, int logId, Stream uploadStream, object userState, CancellationToken cancellationToken)
        {
            var retryEventHandler = GetRetryEventHandler("Vsts_AppendLogContentAsync", scopeIdentifier, planId, cancellationToken);
            
            var records = await retryer.TryActionAsync(
                async () =>
                    await
                        this.client.AppendLogContentAsync(scopeIdentifier, hubName, planId, logId, uploadStream, userState, cancellationToken).ConfigureAwait(false),
                retryEventHandler).ConfigureAwait(false);

            return records;
        }

        protected async Task TraceAsync(Guid scopeIdentifier, Guid planId, CancellationToken cancellationToken, long elapsedMilliseconds, string eventName, string result, string eventMessage)
        {
            var eventProperties = new Dictionary<string, string>()
                                  {
                                      {"VstsPlanUrl", this.vstsUrl},
                                      {"ProjectId", scopeIdentifier.ToString()},
                                      {"PlanId", planId.ToString()},
                                      {"DurationMs", elapsedMilliseconds.ToString()},
                                  };

            await this.instrumentationHandler.HandleTraceEvent(string.Format("{0}_{1}", eventName, result), eventMessage, eventProperties, cancellationToken).ConfigureAwait(false);
        }

        private RetryEventHandler GetRetryEventHandler(string eventName, Guid scopeIdentifier, Guid planId, CancellationToken cancellationToken)
        {
            var eventProperties = new Dictionary<string, string>()
            {
                {"VstsPlanUrl", this.vstsUrl},
                {"ProjectId", scopeIdentifier.ToString()},
                {"PlanId", planId.ToString()},
            };
            
            return new RetryEventHandler(eventName, eventProperties, cancellationToken, this.instrumentationHandler);
        }
    }
}
