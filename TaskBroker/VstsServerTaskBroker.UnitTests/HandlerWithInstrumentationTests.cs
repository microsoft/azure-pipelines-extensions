using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace VstsServerTaskHelper.UnitTests
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
        [TestMethod]
        public async Task MultipleEventsInstrumentedTest()
        {
            // given
            var handler = new MockVstsHandler() { MockExecuteFunc = (msg) => Task.FromResult(new VstsScheduleResult()) };
            var traceBrokerInstrumentation = new TraceBrokerInstrumentation();
            var testVstsMessage = new TestVstsMessage() { RequestType = RequestType.Execute };
            var events = new List<string>();

            // when
            events.Add(string.Format("[{0}] INFO: {1}: {2}", DateTime.UtcNow.ToString("o"), testVstsMessage.RequestType.ToString(), "Processing request"));
            var result = await handler.Execute(testVstsMessage, default(CancellationToken));
            events.Add(string.Format("[{0}] INFO: {1}: {2}: {3}", DateTime.UtcNow.ToString("o"), testVstsMessage.RequestType.ToString(), "Processed request", result.Message));
            var logStream = GenerateStreamFromStringList(events);
            await traceBrokerInstrumentation.HandleEventList(logStream, eventProperties: null, cancellationToken: default(CancellationToken));

            // then
            var requestType = testVstsMessage.RequestType.ToString();
            var logMessages = traceBrokerInstrumentation.Events.First(x => x.Contains(requestType));
            Assert.IsNotNull(logMessages);
            Assert.IsTrue(logMessages.IndexOf(requestType) >=0 );
            Assert.IsTrue(logMessages.Contains("Processing request"));
            Assert.IsTrue(logMessages.Contains("Processed request"));
        }

        private static Stream GenerateStreamFromStringList(IEnumerable<string> lines)
        {
            MemoryStream stream = new MemoryStream();
            StreamWriter writer = new StreamWriter(stream);
            foreach (var line in lines)
            {
                writer.Write(line);
            }
            writer.Flush();
            stream.Position = 0;
            return stream;
        }
    }
}
