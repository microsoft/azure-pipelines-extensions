using System.Diagnostics;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace VstsServerTaskHelper.UnitTests
{
    /// <summary>
    /// Unit test class for <see cref="SchedulingBroker&lt;T&gt;"/> class.
    /// </summary>
    [TestClass]
    public class MessageValidationTests
    {
        [TestMethod]
        public void InvalidMessageFails()
        {
            // given
            var brokeredMessage = SchedulingBrokerTests.CreateMockMessage(new TestVstsMessage());

            // when
            TestVstsMessage testMessage;
            string errors;
            var isValid = ServiceBusQueueMessageHandler<TestVstsMessage>.ExtractMessage(brokeredMessage, out testMessage, out errors);

            // then
            Assert.IsFalse(isValid);
            Assert.IsNotNull(errors);
            Trace.WriteLine(errors);
        }

        [TestMethod]
        public void ValidBuildMessageIsExtracted()
        {
            // given
            var validMessage = SchedulingBrokerTests.CreateValidTestVstsMessage();
            var brokeredMessage = SchedulingBrokerTests.CreateMockMessage(validMessage);

            // when
            TestVstsMessage testMessage;
            string errors;
            var isValid = ServiceBusQueueMessageHandler<TestVstsMessage>.ExtractMessage(brokeredMessage, out testMessage, out errors);

            // then
            Assert.IsTrue(isValid);
            Assert.IsNull(errors);
        }

        [TestMethod]
        public void ValidReleaseMessageIsExtracted()
        {
            // given
            var validMessage = SchedulingBrokerTests.CreateValidTestVstsMessageForRelease();
            var brokeredMessage = SchedulingBrokerTests.CreateMockMessage(validMessage);

            // when
            TestVstsMessage testMessage;
            string errors;
            var isValid = ServiceBusQueueMessageHandler<TestVstsMessage>.ExtractMessage(brokeredMessage, out testMessage, out errors);

            // then
            Assert.IsTrue(isValid);
            Assert.IsNull(errors);
        }

        [TestMethod]
        public void RequesterEmailPreferredOverScheduleRequester()
        {
            // given
            var message = SchedulingBrokerTests.CreateValidTestVstsMessage();
            message.RequesterEmail = "someone";
            message.ScheduleBuildRequesterAlias = "someOneElse";
            var brokeredMessage = SchedulingBrokerTests.CreateMockMessage(message);

            // when
            TestVstsMessage testMessage;
            string errors;
            var isValid = ServiceBusQueueMessageHandler<TestVstsMessage>.ExtractMessage(brokeredMessage, out testMessage, out errors);

            // then
            Assert.IsTrue(isValid);
            Assert.AreEqual("someone", testMessage.RequesterEmail);
        }

        [TestMethod]
        public void RequesterEmailFallbackToScheduleRequester()
        {
            // given
            var message = SchedulingBrokerTests.CreateValidTestVstsMessage();
            message.RequesterEmail = null;
            message.ScheduleBuildRequesterAlias = "someOneElse";
            var brokeredMessage = SchedulingBrokerTests.CreateMockMessage(message);

            // when
            TestVstsMessage testMessage;
            string errors;
            var isValid = ServiceBusQueueMessageHandler<TestVstsMessage>.ExtractMessage(brokeredMessage, out testMessage, out errors);

            // then
            Assert.IsTrue(isValid);
            Assert.AreEqual("someOneElse", testMessage.RequesterEmail);
        }

        [TestMethod]
        public void RequesterEmailFallbackToScheduleRequesterWhenUnresolved()
        {
            // given
            var message = SchedulingBrokerTests.CreateValidTestVstsMessage();
            message.RequesterEmail = "$(someVar)";
            message.ScheduleBuildRequesterAlias = "someOneElse";
            var brokeredMessage = SchedulingBrokerTests.CreateMockMessage(message);

            // when
            TestVstsMessage testMessage;
            string errors;
            var isValid = ServiceBusQueueMessageHandler<TestVstsMessage>.ExtractMessage(brokeredMessage, out testMessage, out errors);

            // then
            Assert.IsTrue(isValid);
            Assert.AreEqual("someOneElse", testMessage.RequesterEmail);
        }
    }
}
