using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace VstsServerTaskBroker
{
    public class TaskHttpClientWrapper : ITaskHttpClient
    {
        private const int RetryCount = 3;
        private const int RetryIntervalInSeconds = 5;

        private readonly TaskHttpClient client;
        private readonly IBrokerInstrumentation instrumentationHandler;
        private readonly string vstsUrl;
        private readonly VstsTaskHttpRetryer retryer;

        public TaskHttpClientWrapper(Uri baseUrl, VssCredentials credentials, IBrokerInstrumentation instrumentationHandler)
        {
            this.client = new TaskHttpClient(baseUrl, credentials);
            this.instrumentationHandler = instrumentationHandler;
            this.vstsUrl = baseUrl.ToString();
            this.retryer = VstsTaskHttpRetryer.CreateRetryer(RetryCount, TimeSpan.FromSeconds(RetryIntervalInSeconds));
        }

        public async Task AppendTimelineRecordFeedAsync(Guid scopeIdentifier, string planType, Guid planId, Guid timelineId, Guid recordId, IEnumerable<string> lines, CancellationToken cancellationToken, object userState)
        {
            const string EventName = "Vsts_AppendTimelineRecordFeedAsync";
            var sw = Stopwatch.StartNew();
            try
            {
                await this.client.AppendTimelineRecordFeedAsync(scopeIdentifier, planType, planId, timelineId, recordId, lines, cancellationToken, userState).ConfigureAwait(false);
                await this.TraceAsync(scopeIdentifier, planId, cancellationToken, sw.ElapsedMilliseconds, EventName, "Succeeded", string.Empty).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                this.TraceAsync(scopeIdentifier, planId, cancellationToken, sw.ElapsedMilliseconds, EventName, "Failed", ex.Message).GetAwaiter().GetResult();
                throw;
            }
        }

        public virtual async Task RaisePlanEventAsync<T>(Guid scopeIdentifier, string planType, Guid planId, T eventData, CancellationToken cancellationToken, object userState = null) 
            where T : JobEvent
        {
            const string EventName = "Vsts_RaisePlanEventAsync";
            var sw = Stopwatch.StartNew();
            try
            {
                await this.client.RaisePlanEventAsync(scopeIdentifier, planType, planId, eventData, cancellationToken, userState).ConfigureAwait(false);
                await this.TraceAsync(scopeIdentifier, planId, cancellationToken, sw.ElapsedMilliseconds, EventName, "Succeeded", string.Empty).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                this.TraceAsync(scopeIdentifier, planId, cancellationToken, sw.ElapsedMilliseconds, EventName, "Failed", ex.Message).GetAwaiter().GetResult();
                throw;
            }
        }

        public async Task<List<TimelineRecord>> UpdateTimelineRecordsAsync(Guid scopeIdentifier, string planType, Guid planId, Guid timelineId, IEnumerable<TimelineRecord> records, CancellationToken cancellationToken, object userState = null)
        {
            const string EventName = "Vsts_UpdateTimelineRecordsAsync";

            var eventProperties = new Dictionary<string, string>()
                                  {
                                      {"VstsPlanUrl", this.vstsUrl},
                                      {"ProjectId", scopeIdentifier.ToString()},
                                      {"PlanId", planId.ToString()},
                                  };

            var retryEventHandler = new RetryEventHandler(EventName, eventProperties, cancellationToken, this.instrumentationHandler);
           
            return await this.retryer.TryActionAsync(
               async () => await this.client.UpdateTimelineRecordsAsync(scopeIdentifier, planType, planId, timelineId, records, cancellationToken, userState).ConfigureAwait(false),
               retryEventHandler);
        }

        public async Task<TaskLog> CreateLogAsync(Guid scopeIdentifier, string hubName, Guid planId, TaskLog log, object userState, CancellationToken cancellationToken)
        {
            const string EventName = "Vsts_CreateLogAsync";
            var sw = Stopwatch.StartNew();
            try
            {
                var retval = await this.client.CreateLogAsync(scopeIdentifier, hubName, planId, log, userState, cancellationToken).ConfigureAwait(false);
                await this.TraceAsync(scopeIdentifier, planId, cancellationToken, sw.ElapsedMilliseconds, EventName, "Succeeded", string.Empty).ConfigureAwait(false);
                return retval;
            }
            catch (Exception ex)
            {
                this.TraceAsync(scopeIdentifier, planId, cancellationToken, sw.ElapsedMilliseconds, EventName, "Failed", ex.Message).GetAwaiter().GetResult();
                throw;
            }
        }

        public async Task<List<TimelineRecord>> GetRecordsAsync(Guid scopeIdentifier, string hubName, Guid planId, Guid timelineId, object userState, CancellationToken cancellationToken)
        {
            const string EventName = "Vsts_GetRecordsAsync";

            var eventProperties = new Dictionary<string, string>()
                                  {
                                      {"VstsPlanUrl", this.vstsUrl},
                                      {"ProjectId", scopeIdentifier.ToString()},
                                      {"PlanId", planId.ToString()},
                                  };

            var retryEventHandler = new RetryEventHandler(EventName, eventProperties, cancellationToken, this.instrumentationHandler);

            // Retry for exceptions like VssServiceResponseException - Internal server error
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
                retryEventHandler,
                false,
                e => (e is VssServiceResponseException || e is NotSupportedException));

            return records;
        }

        public virtual async Task<TaskLog> AppendLogContentAsync(Guid scopeIdentifier, string hubName, Guid planId, int logId, Stream uploadStream, object userState, CancellationToken cancellationToken)
        {
            const string EventName = "Vsts_AppendLogContentAsync";
            var sw = Stopwatch.StartNew();
            try
            {
                var retval = await this.client.AppendLogContentAsync(scopeIdentifier, hubName, planId, logId, uploadStream, userState, cancellationToken).ConfigureAwait(false);
                await this.TraceAsync(scopeIdentifier, planId, cancellationToken, sw.ElapsedMilliseconds, EventName, "Succeeded", string.Empty).ConfigureAwait(false);
                return retval;
            }
            catch (Exception ex)
            {
                this.TraceAsync(scopeIdentifier, planId, cancellationToken, sw.ElapsedMilliseconds, EventName, "Failed", ex.Message).GetAwaiter().GetResult();
                throw;
            }
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
    }
}
