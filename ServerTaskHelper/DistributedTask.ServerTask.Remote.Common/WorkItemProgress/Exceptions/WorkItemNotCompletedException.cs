using System;

namespace DistributedTask.ServerTask.Remote.Common.WorkItemProgress.Exceptions
{
    public class WorkItemNotCompletedException : Exception
    {
        public WorkItemNotCompletedException() : base() { }
        public WorkItemNotCompletedException(string message) : base(message) { }
        public WorkItemNotCompletedException(string message, Exception innerException) : base(message, innerException) { }
    }
}
