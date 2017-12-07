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

        public Exception Exception => this.exceptionReceivedEventArgs.Exception;
        public string Action => this.exceptionReceivedEventArgs.ExceptionReceivedContext.Action;
        public string ClientId => this.exceptionReceivedEventArgs.ExceptionReceivedContext.ClientId;
        public string Endpoint => this.exceptionReceivedEventArgs.ExceptionReceivedContext.Endpoint;
        public string EntityPath => this.exceptionReceivedEventArgs.ExceptionReceivedContext.EntityPath;

        public override string ToString()
        {
            return $"{ExceptionRecievedContextToString()}\n" +
                   $"Exception received: {this.Exception}";
        }

        private string ExceptionRecievedContextToString()
        {
            if (exceptionReceivedEventArgs?.ExceptionReceivedContext == null)
            {
                return string.Empty;
            }

            return "Exception received context:\n" +
                   $"Action: { Action }, " +
                   $"ClientId: { ClientId }, " +
                   $"EndpointId: { Endpoint }, " +
                   $"EntityPath: { EntityPath }";
        }

    }
}