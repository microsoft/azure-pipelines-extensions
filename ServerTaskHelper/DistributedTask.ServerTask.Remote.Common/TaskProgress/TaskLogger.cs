using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common.Request;
using Microsoft.TeamFoundation.DistributedTask.WebApi;

namespace DistributedTask.ServerTask.Remote.Common.TaskProgress
{
    public class TaskLogger
    {
        private readonly TaskProperties taskProperties;

        private int byteCount;
        private int pageCount;
        private string dataFileName;
        private readonly string pagesFolder;
        private readonly string pageId;
        private FileStream pageData;
        private StreamWriter pageWriter;
        private readonly TaskClient taskClient;

        // 8 MB
        private const int PageSize = 8 * 1024 * 1024;

        public TaskLogger(TaskProperties taskProperties, TaskClient taskClient)
        {
            this.taskProperties = taskProperties;
            this.taskClient = taskClient;
            pageId = Guid.NewGuid().ToString();
            pagesFolder = Path.Combine(Path.GetTempPath(), "pages");
            Directory.CreateDirectory(pagesFolder);
        }

        public async Task Log(string message)
        {
            if (!string.IsNullOrEmpty(message) && message.Length > 1024)
            {
                Console.WriteLine("Web console line is more than 1024 chars, truncate to first 1024 chars");
                message = $"{message.Substring(0, 1024)}...";
            }

            var line = $"{DateTime.UtcNow:O} {message}";
            await LogPage(line).ConfigureAwait(false);
        }

        public async Task LogImmediately(string message)
        {
            await Log(message);
            await End();
        }
        public async Task End()
        {
            await EndPage().ConfigureAwait(false);
        }

        //
        // Write a metadata file with id etc, point to pages on disk.
        // Each page is a guid_#.  As a page rolls over, it events it's done
        // and the consumer queues it for upload
        // Ensure this is lazy.  Create a page on first write
        //
        private async Task LogPage(string message)
        {
            // lazy creation on write
            if (pageWriter == null)
            {
                await NewPage().ConfigureAwait(false);
            }

            pageWriter.WriteLine(message);
            byteCount += System.Text.Encoding.UTF8.GetByteCount(message);
            if (byteCount >= PageSize)
            {
                await NewPage().ConfigureAwait(false);
            }
        }

        private async Task NewPage()
        {
            await EndPage().ConfigureAwait(false);
            byteCount = 0;
            dataFileName = Path.Combine(pagesFolder, $"{pageId}_{++pageCount}.log");
            pageData = new FileStream(dataFileName, FileMode.CreateNew);
            pageWriter = new StreamWriter(pageData, System.Text.Encoding.UTF8);
        }

        private async Task EndPage()
        {
            if (pageWriter != null)
            {
                pageWriter.Flush();
                pageData.Flush();
                pageWriter.Dispose();
                pageWriter = null;
                pageData = null;
                var log = new TaskLog(string.Format(@"logs\{0:D}", taskProperties.TaskInstanceId));
                var taskLog = await taskClient.CreateLogAsync(log).ConfigureAwait(false);

                // Upload the contents
                using (var fs = File.Open(dataFileName, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    await taskClient.AppendLogContentAsync(taskLog.Id, fs).ConfigureAwait(false);
                }

                // Create a new record and only set the Log field
                var attachmentUpdataRecord = new TimelineRecord { Id = taskProperties.TaskInstanceId, Log = taskLog };
                await taskClient.UpdateTimelineRecordsAsync(attachmentUpdataRecord, default).ConfigureAwait(false);
            }
        }
        public async Task CreateTaskTimelineRecordIfRequired(TaskClient taskClient, CancellationToken cancellationToken)
        {
            if (taskProperties.TaskInstanceId.Equals(Guid.Empty))
            {
                taskProperties.TaskInstanceId = Guid.NewGuid();
            }

            var timelineRecord = new TimelineRecord
            {
                Id = taskProperties.TaskInstanceId,
                RecordType = "task",
                StartTime = DateTime.UtcNow,
                ParentId = taskProperties.JobId,
            };

            if (!string.IsNullOrWhiteSpace(taskProperties.TaskInstanceName))
            {
                timelineRecord.Name = taskProperties.TaskInstanceName;
            }

            // this is an upsert call
            await taskClient.UpdateTimelineRecordsAsync(timelineRecord, cancellationToken).ConfigureAwait(false);
        }
    }
}