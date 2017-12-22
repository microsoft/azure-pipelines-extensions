using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using VstsServerTaskHelper.Core.VstsClients;

namespace VstsServerTaskHelper.Core
{
    public class PlanHelper
    {
        private readonly Guid projectId;
        private readonly string planType;
        private readonly Guid planId;
        private readonly TaskClient taskClient;

        public PlanHelper(Uri baseUri, VssCredentials vssCredentials, Guid projectId, string planType, Guid planId)
        {
            this.projectId = projectId;
            this.planType = planType;
            this.planId = planId;
            this.taskClient = new TaskClient(baseUri, vssCredentials);
        }

        public async Task<TaskLog> CreateTaskLog(TaskLog taskLog, CancellationToken cancellationToken)
        {
            return await taskClient.CreateLogAsync(this.projectId, planType, planId, taskLog, null, cancellationToken)
                .ConfigureAwait(false);
        }

        public async Task AppendLogContentAsync(int taskLogId, FileStream fs, CancellationToken cancellationToken)
        {
            await taskClient.AppendLogContentAsync(this.projectId, planType, planId, taskLogId, fs, null, cancellationToken).ConfigureAwait(false);
        }

        public async Task UpdateTimelineRecordsAsync(Guid timelineId, TimelineRecord attachmentUpdataRecord, CancellationToken cancellationToken)
        {
            await taskClient.UpdateTimelineRecordsAsync(this.projectId, this.planType, this.planId, timelineId,
                new List<TimelineRecord> {attachmentUpdataRecord}, cancellationToken);
        }

        public async Task AppendTimelineRecordFeedAsync(Guid timelineId, Guid timelineRecordId, IEnumerable<string> lines, CancellationToken cancellationToken)
        {
            await taskClient.AppendTimelineRecordFeedAsync(this.projectId, this.planType, this.planId, timelineId, timelineRecordId, lines, cancellationToken, null);
        }
    }
}
