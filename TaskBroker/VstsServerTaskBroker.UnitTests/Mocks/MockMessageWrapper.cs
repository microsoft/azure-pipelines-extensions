using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace VstsServerTaskHelper
{
    public class MockMessageWrapper : IBrokeredMessageWrapper
    {
        public MockMessageWrapper()
        {
            this.Properties = new Dictionary<string, object>();
        }

        public DateTime LockedUntilUtc { get; set; }

        public object BodyObject { get; set; }

        public bool IsCompleted { get; set; }

        public bool IsAbandoned { get; set; }

        public bool IsDeadLettered { get; set; }

        public Dictionary<string, object> UpdatedProperties { get; set; }

        public Dictionary<string, object> Properties { get; set; }

        public string GetBody()
        {
            if (this.BodyObject != null)
            {
                return this.BodyObject as string;
            }

            throw new NotImplementedException();
        }

        public object GetProperty(string key)
        {
            object value;
            if (this.Properties.TryGetValue(key, out value))
            {
                return value;
            }

            return null;
        }

        public void SetProperty(string key, object value)
        {
            this.Properties[key] = value;
        }

        public Task RenewLockAsync()
        {
            return Task.FromResult<object>(null);
        }

        public Task CompleteAsync()
        {
            this.IsCompleted = true;
            return Task.FromResult<object>(null);
        }

        public Task AbandonAsync()
        {
            this.IsAbandoned = true;
            return Task.FromResult<object>(null);
        }

        public Task AbandonAsync(Dictionary<string, object> updatedProperties)
        {
            this.IsAbandoned = true;
            this.UpdatedProperties = updatedProperties;
            return Task.FromResult<object>(null);
        }

        public Task DeadLetterAsync(Dictionary<string, object> updatedProperties)
        {
            this.IsDeadLettered = true;
            this.UpdatedProperties = updatedProperties;
            return Task.FromResult<object>(null);
        }

        public string GetMessageId()
        {
            return "someMessageId";
        }

        public string GetLockToken()
        {
            return "someToken";
        }
    }
}