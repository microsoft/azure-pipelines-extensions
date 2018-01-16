using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;
using VstsServerTaskHelper.Core.Request;

namespace VstsServerTaskHelper.Core.TaskProgress
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
        private readonly TaskHttpClient taskClient;

        // 8 MB
        private const int PageSize = 8 * 1024 * 1024;

        public TaskLogger(TaskProperties taskProperties)
        {
            this.taskProperties = taskProperties;
            var vssConnection = new VssConnection(taskProperties.PlanUri, new VssBasicCredential(string.Empty, taskProperties.AuthToken));
            taskClient = vssConnection.GetClient<TaskHttpClient>();
            pageId = Guid.NewGuid().ToString();
            pagesFolder = Path.Combine(Path.GetTempPath(), "pages");
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
            await taskClient.AppendTimelineRecordFeedAsync(taskProperties.ProjectId, taskProperties.HubName, taskProperties.PlanId, taskProperties.TimelineId, taskProperties.JobId, new List<string> {line});
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
                var taskLog = await taskClient.CreateLogAsync(taskProperties.ProjectId, taskProperties.HubName, taskProperties.PlanId, new TaskLog(string.Format(@"logs\{0:D}", taskProperties.TaskInstanceId)), default(CancellationToken)).ConfigureAwait(false);

                // Upload the contents
                using (var fs = File.Open(dataFileName, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    await taskClient.AppendLogContentAsync(taskProperties.ProjectId, taskProperties.HubName, taskProperties.PlanId, taskLog.Id, fs, default(CancellationToken)).ConfigureAwait(false);
                }

                // Create a new record and only set the Log field
                var attachmentUpdataRecord = new TimelineRecord { Id = taskProperties.TaskInstanceId, Log = taskLog };
                await taskClient.UpdateTimelineRecordsAsync(taskProperties.ProjectId, taskProperties.HubName, taskProperties.PlanId, taskProperties.TimelineId, new List<TimelineRecord>{attachmentUpdataRecord}).ConfigureAwait(false);
            }
        }
    }
}