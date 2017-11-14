using System;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper
{
    public class HandlerWithInstrumentation<T> : IVstsScheduleHandler<T> 
        where T : VstsMessage
    {
        internal const string HandlerCancelFailedEventName = "HandlerCancelFailed";
        internal const string HandlerExecuteFailedEventName = "HandlerExecuteFailed";
        private readonly IBrokerInstrumentation brokerInstrumentation;
        private readonly IVstsScheduleHandler<T> baseHandler;

        public HandlerWithInstrumentation(IBrokerInstrumentation brokerInstrumentation, IVstsScheduleHandler<T> baseHandler)
        {
            this.brokerInstrumentation = brokerInstrumentation;
            this.baseHandler = baseHandler;
        }

        public async Task<string> Cancel(T vstsMessage, CancellationToken cancellationToken)
        {
            Exception exception = null;
            try
            {
                await this.brokerInstrumentation.HandleInfoEvent(vstsMessage.RequestType.ToString(), "Processing request", eventProperties: null, cancellationToken: cancellationToken).ConfigureAwait(false);
                var result = await this.baseHandler.Cancel(vstsMessage, cancellationToken).ConfigureAwait(false);
                await this.brokerInstrumentation.HandleInfoEvent(vstsMessage.RequestType.ToString(), result, eventProperties: null, cancellationToken: cancellationToken).ConfigureAwait(false);
                return result;
            }
            catch (AggregateException aex)
            {
                exception = aex.InnerExceptions.Count == 1 ? aex.InnerExceptions[0] : aex;
            }
            catch (Exception ex)
            {
                exception = ex;
            }

            // c#6.0 allows await inside catch but this code is not 6.0 yet :-(
            await this.brokerInstrumentation.HandleException(exception, HandlerCancelFailedEventName, "Failed to handle cancel event", eventProperties: null, cancellationToken: cancellationToken).ConfigureAwait(false);
            throw exception;
        }

        public async Task<VstsScheduleResult> Execute(T vstsMessage, CancellationToken cancellationToken)
        {
            Exception exception = null;
            try
            {
                await this.brokerInstrumentation.HandleInfoEvent(vstsMessage.RequestType.ToString(), "Processing request", eventProperties: null, cancellationToken: cancellationToken);
                var result = await this.baseHandler.Execute(vstsMessage, cancellationToken);

                if (result.ScheduleFailed)
                {
                    await this.brokerInstrumentation.HandleErrorEvent(string.Format("{0}_Failed", vstsMessage.RequestType), string.Format("Request failed: {0}", result.Message), eventProperties: null, cancellationToken: cancellationToken);
                }
                else
                {
                    await this.brokerInstrumentation.HandleInfoEvent(vstsMessage.RequestType.ToString(), string.Format("Processed request: {0}", result.Message), eventProperties: null, cancellationToken: cancellationToken);
                }

                return result;
            }
            catch (AggregateException aex)
            {
                exception = aex.InnerExceptions.Count == 1 ? aex.InnerExceptions[0] : aex;
            }
            catch (Exception ex)
            {
                exception = ex;
            }

            // c#6.0 allows await inside catch but this code is not 6.0 yet :-(
            await this.brokerInstrumentation.HandleException(exception, HandlerExecuteFailedEventName, "Failed to handle execute event", eventProperties: null, cancellationToken: cancellationToken);
            throw exception;
        }
    }
}