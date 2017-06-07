using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.TestManagement.WebApi;

namespace VstsTestResultUploader
{
    public interface IVstsTestResultUploader
    {
        /// <summary>
        /// Initializes a test run in Vsts. A TestRun in Vsts is mapped to a TestJob in CloudTest.
        /// This API is invoked from Coordinator before dispatching the TestJob to Agent.
        /// </summary>
        Task<int> InitializeTestRunAsync(string vstsTestJobName, string optionalComments = "");

        /// <summary>
        /// Completes a test run in Vsts. TestRunState can be either Completed or Abandoned.
        /// This API is invoked from Coordinator after a TestJob is completed.
        /// </summary>
        Task CompleteTestRunAsync(
            TestRunState runState,
            int vstsTestJobId,
            string optionalErrorMessage = "", 
            ICollection<int> vstsTestJobIdsToBeAborted = null);
        
        /// <summary>
        /// Publishes results to Vsts. This API is invoked from
        /// 1. Agent after finishing a TestJob.
        /// 2. Coordinator for cached test results.
        /// </summary>
        Task PublishTestResultWithTestRunIdAsync(
            List<VstsTestResultBucket> testResultBuckets,
            int vstsTestJobId);

        /// <summary>
        /// Adds attachments to an existing run.
        /// </summary>
        Task UploadAttachmentAsync(
            int vstsTestJobId,
            string attachment);

        /// <summary>
        /// Wrapper function that is typically used for cached test result. Steps include:
        /// 1. Initialization of test run
        /// 2. Publish the results
        /// 3. Complete the test run.
        /// </summary>
        Task InitializePublishAndCompleteAsync(
            string vstsTestJobName,
            List<VstsTestResultBucket> testResultBuckets,
            TestRunState runState,
            string optionalComments = "",
            string optionalErrorMessage = "");
    }
}
