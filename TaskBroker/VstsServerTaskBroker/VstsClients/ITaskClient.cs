using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.DistributedTask.WebApi;

namespace VstsServerTaskHelper
{
    public interface ITaskClient
    {
        Task AppendTimelineRecordFeedAsync(Guid scopeIdentifier, string planType, Guid planId, Guid timelineId, Guid recordId, IEnumerable<string> lines, CancellationToken cancellationToken, object userState);

        Task RaisePlanEventAsync<T>(Guid scopeIdentifier, string planType, Guid planId, T eventData, CancellationToken cancellationToken, object userState = null) 
            where T : JobEvent;

        Task<List<TimelineRecord>> UpdateTimelineRecordsAsync(Guid scopeIdentifier, string planType, Guid planId, Guid timelineId, IEnumerable<TimelineRecord> records, CancellationToken cancellationToken, object userState = null);

        Task<List<TimelineRecord>> GetRecordsAsync(Guid scopeIdentifier, string hubName, Guid planId, Guid timelineId, object userState, CancellationToken cancellationToken);

        Task<TaskLog> CreateLogAsync(Guid scopeIdentifier, string hubName, Guid planId, TaskLog log, object userState, CancellationToken cancellationToken);

        Task<TaskLog> AppendLogContentAsync(Guid scopeIdentifier, string hubName, Guid planId, int logId, Stream uploadStream, object userState, CancellationToken cancellationToken);
    }
}