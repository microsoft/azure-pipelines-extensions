using System;
using System.IO;
using System.Threading;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using VstsServerTaskHelper.Core.Contracts;

namespace VstsServerTaskHelper.Core
{
    public class PagingLogger : ITaskLogger
    {
        private readonly PlanHelper planHelper;
        public static string PagingFolder = "pages";

        // 8 MB
        public const int PageSize = 8 * 1024 * 1024;

        private readonly Guid timelineId;
        private readonly Guid jobId;
        private readonly string _pageId;
        private FileStream _pageData;
        private StreamWriter _pageWriter;
        private int _byteCount;
        private int _pageCount;
        private string _dataFileName;
        private readonly string _pagesFolder;

        public PagingLogger(PlanHelper planHelper, Guid timelineId, Guid jobId)
        {
            this.planHelper = planHelper;
            this.timelineId = timelineId;
            this.jobId = jobId;
            _pageId = Guid.NewGuid().ToString();
            _pagesFolder = Path.Combine(Path.GetTempPath(), PagingFolder);
            Directory.CreateDirectory(_pagesFolder);
        }

        //
        // Write a metadata file with id etc, point to pages on disk.
        // Each page is a guid_#.  As a page rolls over, it events it's done
        // and the consumer queues it for upload
        // Ensure this is lazy.  Create a page on first write
        //
        public void Log(string message)
        {
            // lazy creation on write
            if (_pageWriter == null)
            {
                Create();
            }

            string line = $"{DateTime.UtcNow:O} {message}";
            _pageWriter.WriteLine(line);
            _byteCount += System.Text.Encoding.UTF8.GetByteCount(line);
            if (_byteCount >= PageSize)
            {
                NewPage();
            }
        }

        public void End()
        {
            EndPage();
        }

        private void Create()
        {
            NewPage();
        }

        private void NewPage()
        {
            EndPage();
            _byteCount = 0;
            _dataFileName = Path.Combine(_pagesFolder, $"{_pageId}_{++_pageCount}.log");
            _pageData = new FileStream(_dataFileName, FileMode.CreateNew);
            _pageWriter = new StreamWriter(_pageData, System.Text.Encoding.UTF8);
        }

        private async void EndPage()
        {
            if (_pageWriter != null)
            {
                _pageWriter.Flush();
                _pageData.Flush();
                //The StreamWriter object calls Dispose() on the provided Stream object when StreamWriter.Dispose is called.
                _pageWriter.Dispose();
                _pageWriter = null;
                _pageData = null;
                var taskLog = await planHelper.CreateTaskLog(new TaskLog(string.Format(@"logs\{0:D}", jobId)), default(CancellationToken)).ConfigureAwait(false);

                // Upload the contents
                using (FileStream fs = File.Open(_dataFileName, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    await planHelper.AppendLogContentAsync(taskLog.Id, fs, default(CancellationToken)).ConfigureAwait(false);
                }

                // Create a new record and only set the Log field
                var attachmentUpdataRecord = new TimelineRecord { Id = jobId, Log = taskLog };
                await planHelper.UpdateTimelineRecordsAsync(timelineId, attachmentUpdataRecord, default(CancellationToken)).ConfigureAwait(false);
            }
        }
    }
}
