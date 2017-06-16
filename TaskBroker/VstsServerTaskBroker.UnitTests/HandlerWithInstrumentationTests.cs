using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.VisualStudio.TestTools.UnitTesting;

using VstsServerTaskBroker.Contracts;

namespace VstsServerTaskBroker.UnitTest
{
    [TestClass]
    public class HandlerWithInstrumentationTests
    {
        [TestMethod]
        public async Task CancelIsInstrumentedTest()
        {
            // given
            var handler = new MockVstsHandler() { MockCancelFunc = (msg) => Task.FromResult("cancelled") };
            var traceBrokerInstrumentation = new TraceBrokerInstrumentation();
            var testVstsMessage = new TestVstsMessage() { RequestType = RequestType.Cancel };

            // when
            var instrumentedHandler = new HandlerWithInstrumentation<TestVstsMessage>(traceBrokerInstrumentation, handler);
            await instrumentedHandler.Cancel(testVstsMessage, default(CancellationToken));

            // then
            Assert.AreEqual(2, traceBrokerInstrumentation.Events.Count(x => x.Equals(testVstsMessage.RequestType.ToString())));
        }

        [TestMethod]
        public async Task ExecuteIsInstrumentedTest()
        {
            // given
            var handler = new MockVstsHandler() { MockExecuteFunc = (msg) => Task.FromResult(new VstsScheduleResult()) };
            var traceBrokerInstrumentation = new TraceBrokerInstrumentation();
            var testVstsMessage = new TestVstsMessage() { RequestType = RequestType.Execute };

            // when
            var instrumentedHandler = new HandlerWithInstrumentation<TestVstsMessage>(traceBrokerInstrumentation, handler);
            await instrumentedHandler.Execute(testVstsMessage, default(CancellationToken));

            // then
            Assert.AreEqual(2, traceBrokerInstrumentation.Events.Count(x => x.Equals(testVstsMessage.RequestType.ToString())));
        }

        [TestMethod]
        public async Task CancelExceptionIsInstrumentedTest()
        {
            // given
            var handler = new MockVstsHandler() { MockCancelFunc = (msg) => { throw new NotSupportedException(); } };
            var traceBrokerInstrumentation = new TraceBrokerInstrumentation();
            var testVstsMessage = new TestVstsMessage() { RequestType = RequestType.Cancel };

            // when
            var instrumentedHandler = new HandlerWithInstrumentation<TestVstsMessage>(traceBrokerInstrumentation, handler);

            Exception actualEx = null;
            try
            {
                await instrumentedHandler.Cancel(testVstsMessage, default(CancellationToken));
            }
            catch (NotSupportedException ex)
            {
                actualEx = ex;
            }

            // then
            Assert.IsNotNull(actualEx);
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals(testVstsMessage.RequestType.ToString())));
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals(HandlerWithInstrumentation<TestVstsMessage>.HandlerCancelFailedEventName)));
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals("NotSupportedException")));
        }

        [TestMethod]
        public async Task ExecuteExceptionIsInstrumentedTest()
        {
            // given
            var handler = new MockVstsHandler() { MockExecuteFunc = (msg) => { throw new NotSupportedException(); } };
            var traceBrokerInstrumentation = new TraceBrokerInstrumentation();
            var testVstsMessage = new TestVstsMessage() { RequestType = RequestType.Execute };

            // when
            var instrumentedHandler = new HandlerWithInstrumentation<TestVstsMessage>(traceBrokerInstrumentation, handler);

            Exception actualEx = null;
            try
            {
                await instrumentedHandler.Execute(testVstsMessage, default(CancellationToken));
            }
            catch (NotSupportedException ex)
            {
                actualEx = ex;
            }

            // then
            Assert.IsNotNull(actualEx);
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals(testVstsMessage.RequestType.ToString())));
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals(HandlerWithInstrumentation<TestVstsMessage>.HandlerExecuteFailedEventName)));
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals("NotSupportedException")));
        }

        [TestMethod]
        public async Task CancelAggregateExceptionIsFlattenedTest()
        {
            // given
            var handler = new MockVstsHandler() { MockCancelFunc = (msg) => { throw new AggregateException(new List<Exception> {new NotSupportedException()}); } };
            var traceBrokerInstrumentation = new TraceBrokerInstrumentation();
            var testVstsMessage = new TestVstsMessage() { RequestType = RequestType.Cancel };

            // when
            var instrumentedHandler = new HandlerWithInstrumentation<TestVstsMessage>(traceBrokerInstrumentation, handler);

            Exception actualEx = null;
            try
            {
                await instrumentedHandler.Cancel(testVstsMessage, default(CancellationToken));
            }
            catch (NotSupportedException ex)
            {
                actualEx = ex;
            }

            // then
            Assert.IsNotNull(actualEx);
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals(testVstsMessage.RequestType.ToString())));
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals(HandlerWithInstrumentation<TestVstsMessage>.HandlerCancelFailedEventName)));
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals("NotSupportedException")));
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals("NotSupportedException")));
        }

        [TestMethod]
        public async Task ExecuteAggregateExceptionIsFlattenedTest()
        {
            // given
            var handler = new MockVstsHandler() { MockExecuteFunc = (msg) => { throw new AggregateException(new List<Exception> { new NotSupportedException() }); } };
            var traceBrokerInstrumentation = new TraceBrokerInstrumentation();
            var testVstsMessage = new TestVstsMessage() { RequestType = RequestType.Execute };

            // when
            var instrumentedHandler = new HandlerWithInstrumentation<TestVstsMessage>(traceBrokerInstrumentation, handler);

            Exception actualEx = null;
            try
            {
                await instrumentedHandler.Execute(testVstsMessage, default(CancellationToken));
            }
            catch (NotSupportedException ex)
            {
                actualEx = ex;
            }

            // then
            Assert.IsNotNull(actualEx);
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals(testVstsMessage.RequestType.ToString())));
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals(HandlerWithInstrumentation<TestVstsMessage>.HandlerExecuteFailedEventName)));
            Assert.AreEqual(1, traceBrokerInstrumentation.Events.Count(x => x.Equals("NotSupportedException")));
        }
    }
}
