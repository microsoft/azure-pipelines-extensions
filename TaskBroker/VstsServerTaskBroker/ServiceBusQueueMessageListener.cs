using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Azure.ServiceBus;

namespace VstsServerTaskHelper
{
    public class ServiceBusQueueMessageListener : IDisposable, IServiceBusQueueMessageListener
    {
        private readonly string connectionString;

        private readonly string queueName;

        private readonly int prefetchCount;

        private readonly int maxConcurrentCalls;

        private QueueClient queueClient;

        private Func<IServiceBusMessage, Task> messageHandlerFunc;

        public ServiceBusQueueMessageListener(string connectionString, string queueName, int prefetchCount, int maxConcurrentCalls)
        {
            this.connectionString = connectionString;
            this.queueName = queueName;
            this.prefetchCount = prefetchCount;
            this.maxConcurrentCalls = maxConcurrentCalls;
        }

        public void Start(Func<IServiceBusMessage, Task> messageHandlerFunc)
        {
            this.messageHandlerFunc = messageHandlerFunc;
            this.queueClient = new QueueClient(this.connectionString, this.queueName);
            this.queueClient.PrefetchCount = this.prefetchCount;
            this.queueClient.RegisterMessageHandler(this.ReceiveMessage, new MessageHandlerOptions(ExceptionReceivedHandler) { AutoComplete = false, MaxConcurrentCalls = this.maxConcurrentCalls });
        }

        private static Task ExceptionReceivedHandler(ExceptionReceivedEventArgs exceptionReceivedEventArgs)
        {
            return Task.CompletedTask;
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
            var wrappedMessage = new ServiceBusMessage(message);
            return this.messageHandlerFunc(wrappedMessage);
        }
    }
}