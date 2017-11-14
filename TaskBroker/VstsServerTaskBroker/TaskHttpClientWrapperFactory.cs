using System;
using Microsoft.VisualStudio.Services.Common;

namespace VstsServerTaskHelper
{
    public class TaskHttpClientWrapperFactory
    {
        public static ITaskHttpClient GetTaskHttpClientWrapper(Uri uri, string authToken, IBrokerInstrumentation instrumentationHandler, bool skipRaisePlanEvents)
        {
            var vssCrediential = new VssBasicCredential(string.Empty, authToken);

            return skipRaisePlanEvents ?
                new TaskHttpClientNoopPlanEventWrapper(uri, vssCrediential, instrumentationHandler) :
                new TaskHttpClientWrapper(uri, vssCrediential, instrumentationHandler);
        }
    }
}
