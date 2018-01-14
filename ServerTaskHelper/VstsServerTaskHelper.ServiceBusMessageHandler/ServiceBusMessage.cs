using System;
using System.Text;
using Microsoft.Azure.ServiceBus;

namespace VstsServerTaskHelper.ServiceBusMessageHandler
{
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
        
        public DateTime LockedUntilUtc => message.SystemProperties.LockedUntilUtc;

        public string GetBody()
        {
            var messageBody = Encoding.UTF8.GetString(message.Body);

            // The payload is serialized using DataContractSerializer with a binary XmlDictionaryWriter
            // which inserts @\u0006string\....\u0009 to the body of the message. 
            // TODO: Use this work around until the server code is fixed.
            var start = messageBody.IndexOf('{');
            var end = messageBody.LastIndexOf('}');
            var length = end - start + 1;
            var cleanMessageBody = messageBody.Substring(start, length);

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
            return this.message.UserProperties.TryGetValue(key, out object value) 
                ? value 
                : null;
        }

        public void SetProperty(string key, object value)
        {
            this.message.UserProperties[key] = value;
        }
    }
}
