using System;
using System.Collections.Generic;
using Microsoft.VisualStudio.Services.Common;

namespace VstsServerTaskHelper
{
    public class TaskClientFactory
    {
        public static ITaskClient GetTaskClient(Uri uri, string authToken, IList<ILogger> loggers, bool skipRaisePlanEvents)
        {
            var vssCrediential = new VssBasicCredential(string.Empty, authToken);

            return skipRaisePlanEvents ?
                new TaskClientNoopPlanEvent(uri, vssCrediential, loggers) :
                new TaskClient(uri, vssCrediential, loggers);
        }
    }
}
