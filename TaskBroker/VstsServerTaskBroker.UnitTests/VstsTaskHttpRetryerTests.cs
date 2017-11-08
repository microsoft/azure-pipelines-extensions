using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace VstsServerTaskBroker.UnitTest
{
    [TestClass]
    public class VstsTaskHttpRetryerTests
    {
        private const int RetryCount = 1;
        private const int RetryIntervalInSeconds = 5;
        private readonly VstsTaskHttpRetryer retryer;

        public VstsTaskHttpRetryerTests()
        {
            this.retryer = VstsTaskHttpRetryer.CreateRetryer(RetryCount, TimeSpan.FromSeconds(RetryIntervalInSeconds));
        }

        [TestMethod]
        public void WaitAndRetry()
        {
            // given
            var traceBrokerInstrumentation = new TraceBrokerInstrumentation();
            var cancelSource = new CancellationTokenSource();

            var eventProperties = new Dictionary<string, string>()
                                  {
                                      {"VstsPlanUrl", "testUrl"},
                                      {"ProjectId", "testProjectId"},
                                      {"PlanId", "testPlanId"}
                                  };

            var retryEventHandler = new RetryEventHandler("TestEvent", eventProperties, cancelSource.Token, traceBrokerInstrumentation);

            // when
            try
            {
                var result = this.retryer.TryActionAsync(
                    () => Task.FromResult(new Exception("any exception")),
                    retryEventHandler);
            }
            catch (Exception ex)
            {
                Assert.AreEqual(ex.Message, "any exception");  
            }

            // then
            var events = traceBrokerInstrumentation.Events;
            Assert.AreEqual(events.Count, 2);
        }
    }
}
