using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using Microsoft.TeamFoundation.DistributedTask.WebApi;

namespace VstsServerTaskHelper.Core.TaskProgress
{
    public class TaskLogger
    {
        private readonly PlanHelper planHelper;
        private readonly Guid timelineId;
        private readonly Guid jobId;
        private readonly Guid timelineRecordId;

        private int byteCount;
        private int pageCount;
        private string dataFileName;
        private readonly string pagesFolder;
        private readonly string pageId;
        private FileStream pageData;
        private StreamWriter pageWriter;

        // 8 MB
        private const int PageSize = 8 * 1024 * 1024;

        public TaskLogger(PlanHelper planHelper, Guid timelineId, Guid jobId, Guid timelineRecordId)
        {
            this.planHelper = planHelper;
            this.timelineId = timelineId;
            this.jobId = jobId;
            this.timelineRecordId = timelineRecordId;

            this.pageId = Guid.NewGuid().ToString();
            this.pagesFolder = Path.Combine(Path.GetTempPath(), "pages");
            Directory.CreateDirectory(pagesFolder);
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
            LogPage(line);
        }

        public void End()
        {
            EndPage();
        }

        //
        // Write a metadata file with id etc, point to pages on disk.
        // Each page is a guid_#.  As a page rolls over, it events it's done
        // and the consumer queues it for upload
        // Ensure this is lazy.  Create a page on first write
        //
        private void LogPage(string message)
        {
            // lazy creation on write
            if (pageWriter == null)
            {
                NewPage();
            }

            var line = $"{DateTime.UtcNow:O} {message}";
            pageWriter.WriteLine(line);
            byteCount += System.Text.Encoding.UTF8.GetByteCount(line);
            if (byteCount >= PageSize)
            {
                NewPage();
            }
        }

        private void NewPage()
        {
            EndPage();
            byteCount = 0;
            dataFileName = Path.Combine(pagesFolder, $"{pageId}_{++pageCount}.log");
            pageData = new FileStream(dataFileName, FileMode.CreateNew);
            pageWriter = new StreamWriter(pageData, System.Text.Encoding.UTF8);
        }

        private async void EndPage()
        {
            if (pageWriter != null)
            {
                pageWriter.Flush();
                pageData.Flush();
                pageWriter.Dispose();
                pageWriter = null;
                pageData = null;
                var taskLog = await planHelper.CreateTaskLog(new TaskLog(string.Format(@"logs\{0:D}", timelineRecordId)), default(CancellationToken)).ConfigureAwait(false);

                // Upload the contents
                using (var fs = File.Open(dataFileName, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    await planHelper.AppendLogContentAsync(taskLog.Id, fs, default(CancellationToken)).ConfigureAwait(false);
                }

                // Create a new record and only set the Log field
                var attachmentUpdataRecord = new TimelineRecord { Id = timelineRecordId, Log = taskLog };
                await planHelper.UpdateTimelineRecordsAsync(timelineId, attachmentUpdataRecord, default(CancellationToken)).ConfigureAwait(false);
            }
        }
    }
}