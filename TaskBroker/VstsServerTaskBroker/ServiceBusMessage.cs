using System;
using System.Text;
using Microsoft.Azure.ServiceBus;

namespace VstsServerTaskHelper
{
	/// <summary>
	/// This class provides a wrapper implementation around the 
	/// Azure Service Bus brokered messageWrapper.
	/// </summary>
	public class ServiceBusMessage : IServiceBusMessage
    {
        private readonly Message message;

        public ServiceBusMessage()
        {
            this.message = new Message();
        }

        public ServiceBusMessage(Message message)
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

        public string GetBody()
        {
            var messageBody = Encoding.UTF8.GetString(message.Body);

            // The payload is serialized using DataContractSerializer with a binary XmlDictionaryWriter
            // which inserts @\u0006string\....\u0009 to the body of the message. 
            // TODO: Use this work around until the server code is fixed.
            var cleanMessageBody = messageBody.Substring(messageBody.IndexOf("{\r\n")).Replace("\u0001", "");

            return cleanMessageBody;
        }

        public string GetMessageId()
        {
            return message.MessageId;
        }

        public string GetLockToken()
        {
            return message.SystemProperties.LockToken;
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
