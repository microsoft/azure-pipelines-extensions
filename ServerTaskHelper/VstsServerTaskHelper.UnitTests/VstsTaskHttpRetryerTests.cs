using System;
using System.Collections.Generic;
using System.Net;
using System.Reflection;
using System.Threading;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace VstsServerTaskHelper.UnitTests
{
    [TestClass]
    public class VstsTaskHttpRetryerTests
    {
        private const int RetryCount = 2;
        private const int RetryIntervalInSeconds = 2;
        private readonly Retryer retryer;

        public VstsTaskHttpRetryerTests()
        {
            this.retryer = Retryer.CreateRetryer(RetryCount, TimeSpan.FromSeconds(RetryIntervalInSeconds));
        }

        [TestMethod]
        public void WaitAndRetry()
        {
            // given
            var traceLogger = new TraceLogger();
            var cancelSource = new CancellationTokenSource();

            var eventProperties = new Dictionary<string, string>()
                                  {
                                      {"VstsPlanUrl", "testUrl"},
                                      {"ProjectId", "testProjectId"},
                                      {"PlanId", "testPlanId"}
                                  };

            var retryEventHandler = new RetryEventHandler("TestEvent", eventProperties, cancelSource.Token, traceLogger);

            // when
            retryer.TryActionAsync<int>(
                () => {
                    Exception ex = new Exception("Unauthorized");
                    throw new WebException("Unauthorized", ex, WebExceptionStatus.ConnectionClosed, new MockWebResponse(HttpStatusCode.Unauthorized));
                },
                retryEventHandler).ConfigureAwait(false);

            // then
            var events = traceLogger.Events;
            Assert.AreEqual(events.Count, RetryCount);
            Assert.AreEqual(events[0], "TestEvent_Retry");
        }

        [TestMethod]
        public void ReplaceDefaultTransientErrors()
        {
            // given
            var traceLogger = new TraceLogger();
            var cancelSource = new CancellationTokenSource();

            var trasientHttpCodes = new HashSet<HttpStatusCode>()
            {
                HttpStatusCode.ExpectationFailed
            };

            var retryEventHandler = new RetryEventHandler("ReplaceDefaultEvent", null, cancelSource.Token, traceLogger, trasientHttpCodes);

            // when
            retryer.TryActionAsync<int>(
                () => throw new WebException("ExpectationFailed", null, WebExceptionStatus.ConnectionClosed, new MockWebResponse(HttpStatusCode.ExpectationFailed)),
                retryEventHandler).ConfigureAwait(false);

            // then
            var events = traceLogger.Events;
            Assert.AreEqual(events.Count, RetryCount);
        }

        [TestMethod]
        public void RetryAndThrowWhenFail()
        {
            // given
            var traceLogger = new TraceLogger();
            var cancelSource = new CancellationTokenSource();

            var retryEventHandler = new RetryEventHandler("ThrowEvent", null, cancelSource.Token, traceLogger);

            // when
            try
            {
                this.retryer.TryActionAsync<int>(
                    () => throw new WebException("Unauthorized", null, WebExceptionStatus.ConnectionClosed, new MockWebResponse(HttpStatusCode.Unauthorized)),
                    retryEventHandler,
                    true).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                Assert.AreEqual(ex.Message, "RequestTimeout");
            }

            // then
            var events = traceLogger.Events;
            Assert.AreEqual(events.Count, RetryCount);
        }

        [TestMethod]
        public void CheckShouldRetry()
        {
            // given
            var traceLogger = new TraceLogger();
            var cancelSource = new CancellationTokenSource();

            var retryEventHandler = new RetryEventHandler("TestEvent", null, cancelSource.Token, traceLogger)
            {
                ShouldRetry = (e, count) => (e is InvalidFilterCriteriaException && count < 1)
            };

            // when
            retryer.TryActionAsync<int>(
                () => throw new InvalidFilterCriteriaException("custom exception"),
                retryEventHandler).ConfigureAwait(false);

            // then
            var events = traceLogger.Events;
            Assert.AreEqual(events.Count, 1);
        }

        [TestMethod]
        public void WaitAndRetryCalculateTest()
        {
            // given
            const int maxRetryAttempt = 100, sleepMsecs = 1000, backoffLimit = 5, expectedMsecs = 3071000;
            var totalMsecs = 0;

            // when
            for (var retryAttempt = 0; retryAttempt < maxRetryAttempt; retryAttempt++)
            {
                var actualMsecs = Retryer.ComputeWaitTimeWithBackoff(retryAttempt, sleepMsecs, backoffLimit);
                totalMsecs += actualMsecs;
            }

            // then
            Assert.IsTrue(totalMsecs > expectedMsecs - 1);
            Assert.IsTrue(totalMsecs < (expectedMsecs + (Retryer.JitterMaxValueMsecs * maxRetryAttempt)));
        }
    }
}
