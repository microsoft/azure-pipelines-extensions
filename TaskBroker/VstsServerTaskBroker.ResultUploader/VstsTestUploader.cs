using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.TestManagement.WebApi;
using Microsoft.VisualStudio.Services.OAuth;
using Microsoft.VisualStudio.Services.WebApi;
using VstsServerTaskBroker.Contracts;
using TestCaseResult = Microsoft.TeamFoundation.TestManagement.WebApi.TestCaseResult;

namespace VstsTestResultUploader
{
    /// <summary>
    /// Main class that handles interactions with the Vsts Test service.
    /// </summary>
    public class VstsTestUploader : IVstsTestResultUploader
    {
        /// <summary>
        /// VSTS has a restriction on the number of results that can be published in an update
        /// to optimize the performance. Attempt to publish more than threshold will result in the
        /// following error:
        /// Maximum 1000 test results can be processed in a single call.
        /// </summary>
        public const int MaxTestResultsThreshold = 1000;

        /// <summary>
        /// Maximum file size that can be uploaded to Vsts as an attachment.
        /// </summary>
        private const int MaxAttachmentFileSizeInBytes = 104857600;

        protected readonly VstsMessageBase VstsMessage;
        
        /// <summary>
        /// Cached httpClientCachedInstance instance.
        /// </summary>
        private TestManagementHttpClient httpClientCachedInstance;

        /// <summary>
        /// Maximum number of retries.
        /// </summary>
        private const int VssClientMaxRetries = 5;
        
        public VstsTestUploader(VstsMessageBase vstsMessage)
        {
            this.VstsMessage = vstsMessage;
        }

        public virtual async Task<int> InitializeTestRunAsync(string vstsTestJobName, string optionalComments = "")
        {
            TestManagementHttpClient httpClient = InitializeHttpClient();
            RunCreateModel runCreateModel = CreateRunCreateModel(vstsTestJobName, optionalComments);
                
            // Create a run
            TestRun testRun =
                await httpClient.CreateTestRunAsync(runCreateModel, VstsMessage.ProjectId).ConfigureAwait(false);

            return testRun.Id;
        }
        
        public virtual async Task CompleteTestRunAsync(TestRunState runState, int vstsTestJobId, string optionalErrorMessage = "", ICollection<int> vstsTestJobIdsToBeAborted = null)
        {
            TestManagementHttpClient httpClient = InitializeHttpClient();
            await CompleteTestRunAsyncInternal(runState, vstsTestJobId, optionalErrorMessage, httpClient).ConfigureAwait(false);

            if (vstsTestJobIdsToBeAborted != null)
            {
                foreach (int testJobToBeAborted in vstsTestJobIdsToBeAborted)
                {
                    await CompleteTestRunAsyncInternal(
                        TestRunState.Aborted, 
                        testJobToBeAborted, 
                        optionalErrorMessage, 
                        httpClient).ConfigureAwait(false);
                }
            }
        }

        public virtual async Task PublishTestResultWithTestRunIdAsync(
            List<VstsTestResultBucket> testResultBuckets, 
            int vstsTestJobId)
        {
            if (testResultBuckets.Count == 0)
            {
                return;
            }
            
            TestManagementHttpClient httpClient = InitializeHttpClient();
            foreach (VstsTestResultBucket testBucket in testResultBuckets)
            {
                TestCaseResult[] convertedResults = testBucket.TestResults;

                // Never publish empty array of results
                if (convertedResults.Length == 0)
                {
                    continue;
                }

                await httpClient.AddTestResultsToTestRunAsync(
                    convertedResults,
                    VstsMessage.ProjectId,
                    vstsTestJobId).ConfigureAwait(false);
            }
        }

        public virtual async Task UploadAttachmentAsync(
            int vstsTestJobId,
            string attachment)
        {
            if (!File.Exists(attachment))
            {
                throw new ArgumentException(string.Format("Attachment file {0} does not exist", attachment));
            }

            var fileInfo = new FileInfo(attachment);
            if (fileInfo.Length > MaxAttachmentFileSizeInBytes)
            {
                return;
            }
            
            byte[] bytes = File.ReadAllBytes(attachment);
            string encodedData = Convert.ToBase64String(bytes, Base64FormattingOptions.InsertLineBreaks);

            TestManagementHttpClient httpClient = InitializeHttpClient();
            var attachmentRequestModel = new TestAttachmentRequestModel(
                encodedData,
                Path.GetFileName(attachment),
                string.Empty,
                AttachmentType.GeneralAttachment.ToString());
                
            await httpClient.CreateTestRunAttachmentAsync(attachmentRequestModel, VstsMessage.ProjectId, vstsTestJobId).ConfigureAwait(false);
        }

        public async Task InitializePublishAndCompleteAsync(
            string vstsTestJobName,
            List<VstsTestResultBucket> testResultBuckets,
            TestRunState runState,
            string optionalComments = "",
            string optionalErrorMessage = "")
        {
            int testRunId = await InitializeTestRunAsync(vstsTestJobName, optionalComments);
            await PublishTestResultWithTestRunIdAsync(testResultBuckets, testRunId).ConfigureAwait(false);
            await CompleteTestRunAsync(runState, testRunId, optionalErrorMessage).ConfigureAwait(false);
        }

        private TestManagementHttpClient InitializeHttpClient()
        {
            if (httpClientCachedInstance != null)
            {
                return httpClientCachedInstance;
            }

            VssClientHttpRequestSettings settings = VssClientHttpRequestSettings.Default.Clone();
            settings.MaxRetryRequest = VssClientMaxRetries;
            var vssOAuthCredential = new VssOAuthAccessTokenCredential(VstsMessage.AuthToken);
            var connection = new VssConnection(new Uri(VstsMessage.VstsUrl), vssOAuthCredential, settings);
            httpClientCachedInstance = connection.GetClient<TestManagementHttpClient>();
            return httpClientCachedInstance;
        }

        private async Task CompleteTestRunAsyncInternal(
            TestRunState runState,
            int vstsTestJobId,
            string optionalErrorMessage,
            TestManagementHttpClient httpClient)
        {
            var runUpdateModel = new RunUpdateModel(
                state: runState.ToString(),
                errorMessage: optionalErrorMessage,
                completedDate: DateTime.UtcNow.ToString(CultureInfo.InvariantCulture));
            await httpClient.UpdateTestRunAsync(
                runUpdateModel,
                VstsMessage.ProjectId,
                vstsTestJobId).ConfigureAwait(false);
        }

        /// <summary>
        /// CloudTest supports both build and release tasks. VSTS properties are set separately for these 
        /// two types of tasks. This function returns correct run create model based on the type of task.
        /// </summary>
        public RunCreateModel CreateRunCreateModel(string vstsTestJobName, string optionalComments)
        {
            if (VstsMessage.BuildProperties != null)
            {
                // This session is initiated from Build task. Use BuildId from BuildProperties
                return new RunCreateModel(
                    name: vstsTestJobName,
                    isAutomated: true,
                    startedDate: DateTime.UtcNow.ToString(CultureInfo.InvariantCulture),
                    comment: optionalComments,
                    buildId: VstsMessage.BuildProperties.BuildId);
            }

            if (VstsMessage.ReleaseProperties != null)
            {
                // This session is initiated from Release task. Use release properties to initialize the test run
                return new RunCreateModel(
                     name: vstsTestJobName,
                     isAutomated: true,
                     startedDate: DateTime.UtcNow.ToString(CultureInfo.InvariantCulture),
                     comment: optionalComments,
                     releaseUri: VstsMessage.ReleaseProperties.ReleaseUri.ToString(),
                     releaseEnvironmentUri: VstsMessage.ReleaseProperties.ReleaseEnvironmentUri.ToString());
            }
            
            throw new ArgumentException("Unexpected VstsMessage. Message should include either BuildProperties and ReleaseProperties");
        }
    }
}
