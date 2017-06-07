using System.Collections.Generic;
using Microsoft.TeamFoundation.TestManagement.WebApi;

namespace VstsTestResultUploader
{
    /// <summary>
    /// Represents a bucket of test results.
    /// </summary>
    public class VstsTestResultBucket
    {
        private readonly List<TestCaseResult> _testResults;

        public VstsTestResultBucket()
        {
            _testResults = new List<TestCaseResult>();
        }

        public TestCaseResult[] TestResults
        {
            get { return _testResults.ToArray(); }
        }

        public void AddTestResult(TestCaseResult vstsTestCaseResult)
        {
            _testResults.Add(vstsTestCaseResult);
        }
    }
}
