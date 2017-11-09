using System;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.Azure.ServiceBus;

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
            this.queueClient = new QueueClient(this.connectionString, this.queueName);
            this.queueClient.PrefetchCount = this.prefetchCount;
            this.queueClient.RegisterMessageHandler(this.ReceiveMessage, new MessageHandlerOptions { AutoComplete = false, MaxConcurrentCalls = this.maxConcurrentCalls });
        }

        public void Stop()
        {
            this.Dispose();
        }

        public void Dispose()
        {
            if (this.queueClient != null)
            {
                this.queueClient.CloseAsync();
                this.queueClient = null;
            }
        }

		public Task CompleteAsync(string lockToken)
		{
			return queueClient.CompleteAsync(lockToken);
		}

		public Task DeadLetterAsync(string lockToken)
		{
			return queueClient.DeadLetterAsync(lockToken);
		}

		public Task AbandonAsync(string lockToken)
		{
			return queueClient.AbandonAsync(lockToken);
		}

		private Task ReceiveMessage(Message message, CancellationToken token)
        {
            var wrappedMessage = new BrokeredMessageWrapper(message);
            return this.messageHandlerFunc(wrappedMessage);
        }
    }

    public class MockServiceBusQueueMessageListener : IServiceBusQueueMessageListener
    {
        public Func<IBrokeredMessageWrapper, Task> MessageHandlerFunc { get; set; }

		public bool IsCompleted { get; set; }

		public bool IsAbandoned { get; set; }

		public bool IsDeadLettered { get; set; }

		public void Start(Func<IBrokeredMessageWrapper, Task> messageHandlerFunc)
        {
            this.MessageHandlerFunc = messageHandlerFunc;
        }

        public void Stop()
        {
        }

		public Task CompleteAsync(string lockToken)
		{
			this.IsCompleted = true;
			return Task.FromResult<object>(null);
		}

		public Task AbandonAsync(string lockToken)
		{
			this.IsAbandoned = true;
			return Task.FromResult<object>(null);
		}
		
		public Task DeadLetterAsync(string lockToken)
		{
			this.IsDeadLettered = true;
			return Task.FromResult<object>(null);
		}

	}
}