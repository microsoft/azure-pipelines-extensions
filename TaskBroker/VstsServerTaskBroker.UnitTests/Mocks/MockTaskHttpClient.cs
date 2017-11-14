using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.DistributedTask.WebApi;

namespace VstsServerTaskHelper
{
    public class MockTaskHttpClient : ITaskHttpClient
    {
        public MockTaskHttpClient()
        {
            this.EventsReceived = new List<JobEvent>();
            this.LogLines = new List<string>();
            this.TimelineRecordsUpdated = new List<TimelineRecord>();
        }

        public List<JobEvent> EventsReceived { get; set; }

        public List<string> LogLines { get; set; }

        public List<TimelineRecord> TimelineRecordsUpdated { get; set; }

        public List<TimelineRecord> GetRecordsReturnCollection { get; set; }

        public Task AppendTimelineRecordFeedAsync(Guid scopeIdentifier, string planType, Guid planId, Guid timelineId, Guid recordId, IEnumerable<string> lines, CancellationToken cancellationToken, object userState)
        {
            return Task.FromResult<object>(null);
        }

        public Task RaisePlanEventAsync<T>(Guid scopeIdentifier, string planType, Guid planId, T eventData, CancellationToken cancellationToken, object userState = null) 
            where T : JobEvent
        {
            this.EventsReceived.Add(eventData);
            return Task.FromResult<object>(null);
        }

        public Task<List<TimelineRecord>> UpdateTimelineRecordsAsync(Guid scopeIdentifier, string planType, Guid planId, Guid timelineId, IEnumerable<TimelineRecord> records, CancellationToken cancellationToken, object userState = null)
        {
            this.TimelineRecordsUpdated.AddRange(records);
            return Task.FromResult<List<TimelineRecord>>(null);
        }

        public Task<List<TimelineRecord>> GetRecordsAsync(Guid scopeIdentifier, string hubName, Guid planId, Guid timelineId, object userState, CancellationToken cancellationToken)
        {
            return Task.FromResult(this.GetRecordsReturnCollection ?? new List<TimelineRecord>());
        }

        public Task<TaskLog> CreateLogAsync(Guid scopeIdentifier, string hubName, Guid planId, TaskLog log, object userState, CancellationToken cancellationToken)
        {
            return Task.FromResult(new TaskLog("somePath") { Id = 123 });
        }

        public Task<TaskLog> AppendLogContentAsync(Guid scopeIdentifier, string hubName, Guid planId, int logId, Stream uploadStream, object userState, CancellationToken cancellationToken)
        {
            using (var reader = new StreamReader(uploadStream))
            {
                var logString = reader.ReadToEnd();
                this.LogLines.Add(logString);
            }

            return Task.FromResult(new TaskLog("somePath"));
        }
    }
}