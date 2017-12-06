using System;
using Microsoft.Azure.ServiceBus;

namespace VstsServerTaskHelper
{
    public class ServiceBusMessageExceptionHandler : IServiceBusMessageExceptionHandler
    {
        private readonly ExceptionReceivedEventArgs exceptionReceivedEventArgs;

        public ServiceBusMessageExceptionHandler(ExceptionReceivedEventArgs exceptionReceivedEventArgs)
        {
            this.exceptionReceivedEventArgs = exceptionReceivedEventArgs ?? throw new ArgumentNullException(nameof(exceptionReceivedEventArgs));
        }

        public Exception GetException()
        {
            return this.exceptionReceivedEventArgs.Exception;
        }

        public ExceptionReceivedContext GetExceptionReceivedContext()
        {
            return this.exceptionReceivedEventArgs.ExceptionReceivedContext;
        }

        public override string ToString()
        {
            return $"{ExceptionRecievedContextToString()}\n" +
                   $"Exception received: {this.GetException()}";
        }

        private string ExceptionRecievedContextToString()
        {
            if (exceptionReceivedEventArgs?.ExceptionReceivedContext == null)
            {
                return string.Empty;
            }

            return "Exception received context:\n" +
                   $"Action: {GetExceptionReceivedContext().Action}, " +
                   $"ClientId: {GetExceptionReceivedContext().ClientId}, " +
                   $"EndpointId: {GetExceptionReceivedContext().Endpoint}, " +
                   $"EntityPath: {GetExceptionReceivedContext().EntityPath}";
        }
    }
}