using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.Services.Common;

namespace VstsServerTaskHelper
{
    /// <summary>
    /// Agent-based and agent-less tasks behave slightly differently in dealing with 
    /// updates. It is not allowed to raise Plan/JobEvents in the case of agent-based tasks,
    /// since agents would have raised the events already, and any further event will cause
    /// timeline to fail immediately.
    /// </summary>
    public class TaskClientNoopPlanEvent : TaskClient
    {
        public TaskClientNoopPlanEvent(Uri baseUrl, VssCredentials credentials, IList<ILogger> loggers) 
            : base(baseUrl, credentials, loggers)
        {
        }
        
        public override async Task RaisePlanEventAsync<T>(
            Guid scopeIdentifier,
            string planType,
            Guid planId,
            T eventData,
            CancellationToken cancellationToken,
            object userState = null)
        {
            const string EventName = "Vsts_NoopRaisePlanEventAsync";
            await this.TraceAsync(scopeIdentifier, planId, cancellationToken, 0, EventName, "Succeeded", string.Empty).ConfigureAwait(false);
        }
    }
}
