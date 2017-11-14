using System;
using System.Threading.Tasks;

namespace VstsServerTaskHelper
{
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