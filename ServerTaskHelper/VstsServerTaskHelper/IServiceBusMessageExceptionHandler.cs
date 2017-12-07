using System;

namespace VstsServerTaskHelper
{
    public interface IServiceBusMessageExceptionHandler
    {
        Exception Exception { get; }

        // Gets the context of the exception (action, namespace name, and entity path).
        string Action { get; }

        string ClientId { get; }
        string Endpoint { get; }
        string EntityPath { get; }
    }
}