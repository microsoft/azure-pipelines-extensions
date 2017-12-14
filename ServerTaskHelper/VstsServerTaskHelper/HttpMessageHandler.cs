using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.Services.Client;

namespace VstsServerTaskHelper
{
    public class HttpMessageHandler<T> : IVstsMessageHandler<T> where T: VstsMessage
    {
        private readonly IVstsScheduleHandler<T> scheduleHandler;
        private readonly ILogger logger;

        public HttpMessageHandler(IVstsScheduleHandler<T> scheduleHandler, ILogger logger)
        {
            this.scheduleHandler = scheduleHandler;
            this.logger = logger;
        }

        public async Task RecieveMessageAsync(T vstsMessagey, CancellationToken cancellationToken)
        {
            var extractResult = ServiceBusQueueMessageHandler<T>.ExtractMessage(out var vstsMessage, out var validationErrors, vstsMessagey);
            if (!extractResult)
            {
                throw new InvalidOperationException(validationErrors);
            }
            var vssCredentials = new VssClientCredentials();
            ITaskClient taskClient = new TaskClient(vstsMessage.VstsPlanUri, vssCredentials, logger);
            var timelineName = string.Format("{0}_{1}", "Test", vstsMessage.JobId.ToString("D"));
            var logId = ServiceBusQueueMessageHandler<T>.GetOrCreateTaskLogId(CancellationToken.None,
                taskClient, vstsMessage.ProjectId, vstsMessage.PlanId, vstsMessage.JobId, vstsMessage.TimelineId,
                timelineName, vstsMessage.VstsHub.ToString(), "Worker").Result;
            var vstsLogger = new VstsLogger(logger, taskClient, vstsMessage.VstsHub.ToString(), vstsMessage.ProjectId, vstsMessage.PlanId, logId, vstsMessage.TimelineId, vstsMessage.JobId);
            var loggersAggregate = new LoggersAggregate(new List<ILogger>{vstsLogger, logger});
            var handlerWithInstrumentation = new HandlerWithInstrumentation<T>(loggersAggregate, scheduleHandler);
            await handlerWithInstrumentation.Execute(vstsMessage, new Dictionary<string, string>(), CancellationToken.None).ConfigureAwait(false);
        }

        // extract message
        // create task client to pass to vstslogger, create new tasklogid
        // create loggeraggregate
        // create a wrapper handlerwith instrumentation
        // call wrapper handler
    }
}
