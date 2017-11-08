using System;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Formatters.Binary;
using Microsoft.Azure.ServiceBus;

namespace VstsServerTaskBroker.Azure.ServiceBus
{
	/// <summary>
	/// This class provides a wrapper implementation around the 
	/// Azure Service Bus brokered messageWrapper.
	/// </summary>
	public class BrokeredMessageWrapper : IBrokeredMessageWrapper
    {
        private readonly Message message;

        public BrokeredMessageWrapper()
        {
            this.message = new Message();
        }

        public BrokeredMessageWrapper(Message message)
        {
            this.message = message;
        }
        
        public DateTime LockedUntilUtc
        {
            get
            {
                return message.SystemProperties.LockedUntilUtc;
            }
        }

        public T GetBody<T>()
        {
			using (MemoryStream ms = new MemoryStream(message.Body))
			{
				IFormatter br = new BinaryFormatter();
				return (T)br.Deserialize(ms);
			}
        }

        public string GetMessageId()
        {
            return message.MessageId;
        }

        public object GetProperty(string key)
        {
            object value;
            if (this.message.UserProperties.TryGetValue(key, out value))
            {
                return value;
            }

            return null;
        }

        public void SetProperty(string key, object value)
        {
            this.message.UserProperties[key] = value;
        }
    }
}
