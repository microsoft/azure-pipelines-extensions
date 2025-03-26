using System;

namespace DistributedTask.ServerTask.Remote.Common.Exceptions
{
    public class AzureFunctionEvaluationException : Exception
    {
        public AzureFunctionEvaluationException() : base() { }
        public AzureFunctionEvaluationException(string message) : base(message) { }
        public AzureFunctionEvaluationException(string message, Exception innerException) : base(message, innerException) { }
    }
}
