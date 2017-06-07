using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.ServiceBus.Messaging;

namespace VstsServerTaskBroker.Azure.ServiceBus
{
    /// <summary>
    /// This class provides a wrapper implementation around the 
    /// Azure Service Bus brokered messageWrapper.
    /// </summary>
    public class BrokeredMessageWrapper : IBrokeredMessageWrapper
    {
        private readonly BrokeredMessage message;

        public BrokeredMessageWrapper()
        {
            this.message = new BrokeredMessage();
        }

        public BrokeredMessageWrapper(BrokeredMessage message)
        {
            this.message = message;
        }
        
        public DateTime LockedUntilUtc
        {
            get
            {
                return message.LockedUntilUtc;
            }
        }

        public T GetBody<T>()
        {
            return message.GetBody<T>();
        }

        public string GetMessageId()
        {
            return message.MessageId;
        }

        public object GetProperty(string key)
        {
            object value;
            if (this.message.Properties.TryGetValue(key, out value))
            {
                return value;
            }

            return null;
        }

        public void SetProperty(string key, object value)
        {
            this.message.Properties[key] = value;
        }

        public async Task RenewLockAsync()
        {
            await message.RenewLockAsync();
        }

        public Task CompleteAsync()
        {
            return message.CompleteAsync();
        }

        public Task DeadLetterAsync(Dictionary<string, object> updatedProperties)
        {
            return message.DeadLetterAsync(updatedProperties);
        }

        public Task AbandonAsync(Dictionary<string, object> updatedProperties)
        {
            return message.AbandonAsync(updatedProperties);
        }

        public Task AbandonAsync()
        {
            return message.AbandonAsync();
        }
    }
}
