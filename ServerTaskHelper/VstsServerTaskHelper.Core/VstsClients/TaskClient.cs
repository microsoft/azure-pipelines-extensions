using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace VstsServerTaskHelper.Core.VstsClients
{
    public class TaskClient : ITaskClient
    {
        private readonly TaskHttpClient client;

        public TaskClient(Uri baseUrl, VssCredentials credentials)
        {
            var vssConnection = new VssConnection(baseUrl, credentials);
            this.client = vssConnection.GetClient<TaskHttpClient>();
            baseUrl.ToString();
        }

        public async Task AppendTimelineRecordFeedAsync(Guid scopeIdentifier, string planType, Guid planId,
            Guid timelineId, Guid recordId, IEnumerable<string> lines, CancellationToken cancellationToken,
            object userState)
        {
            await this.client.AppendTimelineRecordFeedAsync(scopeIdentifier, planType, planId, timelineId, recordId,
                lines, cancellationToken, userState).ConfigureAwait(false);
        }

        public virtual async Task RaisePlanEventAsync<T>(Guid scopeIdentifier, string planType, Guid planId, T eventData, CancellationToken cancellationToken, object userState = null) 
            where T : JobEvent
        {
            await this.client
                .RaisePlanEventAsync(scopeIdentifier, planType, planId, eventData, cancellationToken, userState)
                .ConfigureAwait(false);
        }

        public async Task<List<TimelineRecord>> UpdateTimelineRecordsAsync(Guid scopeIdentifier, string planType, Guid planId, Guid timelineId, IEnumerable<TimelineRecord> records, CancellationToken cancellationToken, object userState = null)
        {
                return await this.client.UpdateTimelineRecordsAsync(scopeIdentifier, planType, planId, timelineId, records, cancellationToken, userState).ConfigureAwait(false);
        }

        public async Task<TaskLog> CreateLogAsync(Guid scopeIdentifier, string hubName, Guid planId, TaskLog log, object userState, CancellationToken cancellationToken)
        {
            return await this.client.CreateLogAsync(scopeIdentifier, hubName, planId, log, userState, cancellationToken)
                .ConfigureAwait(false);
        }

        public async Task<List<TimelineRecord>> GetRecordsAsync(Guid scopeIdentifier, string hubName, Guid planId, Guid timelineId, object userState, CancellationToken cancellationToken)
        {
            // Retry for exceptions like VssServiceResponseException - Internal server error
                    var timelineRecords = await this.client.GetRecordsAsync(scopeIdentifier, hubName, planId, timelineId, null, userState, cancellationToken).ConfigureAwait(false);

                    // If it has no time line records then retry the get records async call
                    if (timelineRecords.Count == 0)
                    {
                        throw new NotSupportedException("Having no time line records is not supported");
                    }

                    return timelineRecords;
        }

        public virtual async Task<TaskLog> AppendLogContentAsync(Guid scopeIdentifier, string hubName, Guid planId, int logId, Stream uploadStream, object userState, CancellationToken cancellationToken)
        {
            return await
                this.client.AppendLogContentAsync(scopeIdentifier, hubName, planId, logId, uploadStream, userState,
                    cancellationToken).ConfigureAwait(false);
        }
    }
}
