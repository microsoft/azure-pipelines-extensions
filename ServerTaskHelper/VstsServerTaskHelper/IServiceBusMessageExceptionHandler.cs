using System;

namespace VstsServerTaskHelper
{
    public interface IServiceBusMessageExceptionHandler
    {
        Exception GetException();
    }
}