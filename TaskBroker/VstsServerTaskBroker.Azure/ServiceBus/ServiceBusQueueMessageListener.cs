using System;
using System.Threading.Tasks;

using Microsoft.ServiceBus.Messaging;

namespace VstsServerTaskBroker.Azure.ServiceBus
{
    public class ServiceBusQueueMessageListener : IDisposable, IServiceBusQueueMessageListener
    {
        private readonly string connectionString;

        private readonly string queueName;

        private readonly int prefetchCount;

        private readonly int maxConcurrentCalls;

        private QueueClient queueClient;

        private Func<IBrokeredMessageWrapper, Task> messageHandlerFunc;

        public ServiceBusQueueMessageListener(string connectionString, string queueName, int prefetchCount, int maxConcurrentCalls)
        {
            this.connectionString = connectionString;
            this.queueName = queueName;
            this.prefetchCount = prefetchCount;
            this.maxConcurrentCalls = maxConcurrentCalls;
        }

        public void Start(Func<IBrokeredMessageWrapper, Task> messageHandlerFunc)
        {
            this.messageHandlerFunc = messageHandlerFunc;
            this.queueClient = QueueClient.CreateFromConnectionString(this.connectionString, this.queueName);
            this.queueClient.PrefetchCount = this.prefetchCount;
            this.queueClient.OnMessageAsync(this.ReceiveMessage, new OnMessageOptions { AutoComplete = false, MaxConcurrentCalls = this.maxConcurrentCalls });
        }

        public void Stop()
        {
            this.Dispose();
        }

        public void Dispose()
        {
            if (this.queueClient != null)
            {
                this.queueClient.Close();
                this.queueClient = null;
            }
        }

        private Task ReceiveMessage(BrokeredMessage message)
        {
            var wrappedMessage = new BrokeredMessageWrapper(message);
            return this.messageHandlerFunc(wrappedMessage);
        }
    }

    public class MockServiceBusQueueMessageListener : IServiceBusQueueMessageListener
    {
        public Func<IBrokeredMessageWrapper, Task> MessageHandlerFunc { get; set; }

        public void Start(Func<IBrokeredMessageWrapper, Task> messageHandlerFunc)
        {
            this.MessageHandlerFunc = messageHandlerFunc;
        }

        public void Stop()
        {
        }
    }
}