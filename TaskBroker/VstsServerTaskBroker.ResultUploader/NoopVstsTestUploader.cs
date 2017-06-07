using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.TestManagement.WebApi;

namespace VstsTestResultUploader
{
    /// <summary>
    /// A dummy class used when uploading results to VSTS is turned off.
    /// </summary>
    public class NoopVstsTestUploader : IVstsTestResultUploader
    {
        public Task<int> InitializeTestRunAsync(string vstsTestJobName, string optionalComments = "")
        {
            return Task.FromResult(-1);
        }

        public Task CompleteTestRunAsync(TestRunState runState, int vstsTestJobId, string optionalErrorMessage = "", ICollection<int> vstsTestJobIdsToBeAborted = null)
        {
            return Task.Delay(0);
        }
        
        public Task PublishTestResultWithTestRunIdAsync(List<VstsTestResultBucket> testResultBuckets, int vstsTestJobId)
        {
            return Task.Delay(0);
        }

        public Task UploadAttachmentAsync(int vstsTestJobId, string attachment)
        {
            return Task.Delay(0);
        }

        public Task InitializePublishAndCompleteAsync(
            string vstsTestJobName,
            List<VstsTestResultBucket> testResultBuckets,
            TestRunState runState,
            string optionalComments = "",
            string optionalErrorMessage = "")
        {
            return Task.Delay(0);
        }
    }
}
