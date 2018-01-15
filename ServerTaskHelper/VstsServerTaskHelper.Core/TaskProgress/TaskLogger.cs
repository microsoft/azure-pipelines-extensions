using System;
using System.Collections.Generic;
using System.Threading;

namespace VstsServerTaskHelper.Core.TaskProgress
{
    public class TaskLogger
    {
        private readonly PlanHelper planHelper;
        private readonly Guid timelineId;
        private readonly Guid jobId;
        private readonly PagingLogger pagingLogger;

        public TaskLogger(PlanHelper planHelper, Guid timelineId, Guid jobId, Guid timelineRecordId)
        {
            this.planHelper = planHelper;
            this.timelineId = timelineId;
            this.jobId = jobId;
            this.pagingLogger = new PagingLogger(planHelper, timelineId, timelineRecordId);
        }

        public async void Log(string message)
        {
            if (!string.IsNullOrEmpty(message) && message.Length > 1024)
            {
                Console.WriteLine("Web console line is more than 1024 chars, truncate to first 1024 chars");
                message = $"{message.Substring(0, 1024)}...";
            }


            var line = $"{DateTime.UtcNow:O} {message}";
            await this.planHelper.AppendTimelineRecordFeedAsync(timelineId, jobId, new List<string> {line}, default(CancellationToken));
            pagingLogger.Log(line);
        }

        public void End()
        {
            pagingLogger.End();
        }
    }
}