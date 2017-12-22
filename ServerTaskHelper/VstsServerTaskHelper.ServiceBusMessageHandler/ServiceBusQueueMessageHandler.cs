using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using VstsServerTaskHelper.Core;
using VstsServerTaskHelper.Core.Contracts;

namespace VstsServerTaskHelper.ServiceBusMessageHandler
{
    public class ServiceBusQueueMessageHandler
    {
        private const string RetryAttemptPropertyName = "RetryAttempt";
        private const string MessageIdPropertyName = "MessageId";
        private const string ErrorTypePropertyName = "ErrorType";
        private const string ErrorMessagePropertyName = "ErrorMessage";
        private const string MachineNamePropertyName = "MachineName";
        private const string ProcessingTimeMsPropertyName = "ProcessingTimeMs";

        private const int MaxExceptionMessageLength = 100;
        
        private readonly ITaskExecutionHandler taskExecutionHandler;
        private readonly ServiceBusQueueMessageHandlerSettings settings;
        private readonly IServiceBusQueueMessageListener queueClient;

        public ServiceBusQueueMessageHandler(IServiceBusQueueMessageListener queueClient, ITaskExecutionHandler taskExecutionHandler, ServiceBusQueueMessageHandlerSettings settings)
        {
            this.taskExecutionHandler = taskExecutionHandler;
            this.settings = settings;
            this.queueClient = queueClient;
        }

        public async Task ReceiveAsync(IServiceBusMessage message, CancellationToken cancellationToken)
        {
            // setup basic message properties
            var messageStopwatch = Stopwatch.StartNew();
            var eventProperties = ExtractServiceBusMessageProperties(message);
            Exception exception = null;
            try
            {
                var executionHandler = new ExecutionHandler(taskExecutionHandler, eventProperties);
                var result = await executionHandler.Execute(cancellationToken);
                if (result.Result==TaskResult.Abandoned)
                {
                    await this.DeadLetterMessage(message.GetLockToken()).ConfigureAwait(false);
                    StopTimer(messageStopwatch, eventProperties);
                    return;
                }

                await this.queueClient.CompleteAsync(message.GetLockToken()).ConfigureAwait(false);
                StopTimer(messageStopwatch, eventProperties);
            }
            catch (Exception ex)
            {
                exception = ex;
            }

            // c#6.0 allows await inside catch but this code is not 6.0 yet :-(
            if (exception != null)
            {
                StopTimer(messageStopwatch, eventProperties);
                await this.AbandonOrDeadLetterMessage(message.GetLockToken(), exception, eventProperties, cancellationToken).ConfigureAwait(false);
            }
        }

        private static IDictionary<string, string> ExtractServiceBusMessageProperties(IServiceBusMessage message)
        {
            var eventProperties = new Dictionary<string, string>();
            var attemptObject = message.GetProperty(RetryAttemptPropertyName) ?? "0";
            int.TryParse(attemptObject.ToString(), out var attempt);
            attempt++;

            eventProperties[RetryAttemptPropertyName] = attempt.ToString();
            eventProperties[MessageIdPropertyName] = message.GetMessageId();
            eventProperties[MachineNamePropertyName] = Environment.MachineName;

            return eventProperties;
        }

        private static void StopTimer(Stopwatch messageStopwatch, IDictionary<string, string> eventProperties)
        {
            messageStopwatch.Stop();
            eventProperties[ProcessingTimeMsPropertyName] = messageStopwatch.ElapsedMilliseconds.ToString();
        }

        private async Task AbandonOrDeadLetterMessage(string lockToken, Exception exception, IDictionary<string, string> eventProperties, CancellationToken cancellationToken)
        {
            eventProperties.TryGetValue(RetryAttemptPropertyName, out var attemptString);
            int.TryParse(attemptString, out var attempt);

            var exceptionTypeName = exception.GetType().Name;
            eventProperties[ErrorMessagePropertyName] = exception.Message.Substring(0, Math.Min(exception.Message.Length, MaxExceptionMessageLength));
            eventProperties[ErrorTypePropertyName] = exceptionTypeName;

            if (attempt > this.settings.MaxRetryAttempts)
            {
                await this.DeadLetterMessage(lockToken).ConfigureAwait(false);
            }
            else
            {
                await this.DelayedAbandon(attempt, cancellationToken, lockToken).ConfigureAwait(false);
            }
        }

        private async Task DelayedAbandon(int attempt, CancellationToken cancellationToken, string lockToken)
        {
            // exponential backoff
            var delayMsecs = this.settings.AbandonDelayMsecs + (1000 * (int)(Math.Pow(2, Math.Max(0, attempt - 1)) - 1));
            delayMsecs = Math.Min(delayMsecs, this.settings.MaxAbandonDelayMsecs);

            while (delayMsecs > 0)
            {
                // await message.RenewLockAsync().ConfigureAwait(false);
                var delay = settings.LockRefreshDelayMsecs == 0 ? 10 : settings.LockRefreshDelayMsecs;
                await Task.Delay(delay, cancellationToken);
                delayMsecs -= delay;
                cancellationToken.ThrowIfCancellationRequested();
            }

            await this.queueClient.AbandonAsync(lockToken).ConfigureAwait(false);
        }

        private async Task DeadLetterMessage(string messageLockToken)
        {
            await this.queueClient.DeadLetterAsync(messageLockToken).ConfigureAwait(false);
        }
    }
}
