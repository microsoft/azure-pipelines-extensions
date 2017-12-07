using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace VstsServerTaskHelper
{
    /// <summary>
    /// A class that is responsible for retrying an action if it throws an exception.
    /// </summary>
    public class Retryer
    {
        internal const int JitterMaxValueMsecs = 200;

        /// <summary>
        /// Number of retries for the action.
        /// </summary>
        private readonly int numOfRetries;

        /// <summary>
        /// Wait time between each try.
        /// </summary>
        private readonly TimeSpan interval;
        
        /// <summary>
        /// Initializes an object of this class.
        /// </summary>
        /// <param name="numOfRetries">Number or retries for the action.</param>
        /// <param name="interval">Wait time between each retry.</param>
        private Retryer(int numOfRetries, TimeSpan interval)
        {
            if (numOfRetries <= 0)
            {
                throw new ArgumentException("Number of retries must be greater or equal to zero");
            }
            
            this.numOfRetries = numOfRetries;
            this.interval = interval;
        }
        
        /// <summary>
        /// Creates a new instance of this class.
        /// </summary>
        /// <param name="numOfRetries">Number or retries for the action.</param>
        /// <param name="interval">Wait time between each retry.</param>
        public static Retryer CreateRetryer(int numOfRetries, TimeSpan interval)
        {
            return new Retryer(numOfRetries, interval);
        }

        /// <summary>
        /// Starts running the given async action wrapped in retry logic.
        /// </summary>
        /// <param name="asyncAction">Function to run with retry logic.</param>
        /// <param name="retryEventHandler">Handler for success, retry and fail.</param>
        /// <param name="isNoThrow">Does not throw if set to true.</param>
        /// <typeparam name="T">The output of the asyncAction.</typeparam>
        public async Task<T> TryActionAsync<T>(Func<Task<T>> asyncAction, IRetryEventHandler retryEventHandler = null, bool isNoThrow = false)
        {
            int retries = 0;

            while (true)
            {
                var sw = Stopwatch.StartNew();

                try
                {
                    retries++;
                    var retval = await asyncAction();

                    if (retryEventHandler != null)
                    {
                        retryEventHandler.HandleSuccess(retries, sw.ElapsedMilliseconds);
                    }

                    return retval;
                }
                catch (Exception e)
                {
                    if (retries < numOfRetries && (retryEventHandler == null || retryEventHandler.HandleShouldRetry(e, retries)))
                    {
                        if (retryEventHandler != null)
                        {
                            retryEventHandler.HandleRetry(e, retries, sw.ElapsedMilliseconds);
                        }

                        var sleepMSecs = ComputeWaitTimeWithBackoff(retries, interval.Milliseconds, numOfRetries);
                        Task.Delay(sleepMSecs).Wait();
                    }
                    else
                    {
                        if (retryEventHandler != null)
                        {
                            retryEventHandler.HandleFail(e, retries, sw.ElapsedMilliseconds);
                        }

                        if (!isNoThrow)
                        {
                            throw;
                        }
                        else
                        {
                            return default(T);
                        }
                    }
                }
            }
        }

        internal static int ComputeWaitTimeWithBackoff(int retryAttempt, int sleepMsecs, int backoffLimit)
        {
            var rnd = new Random();
            var jitterMsecs = rnd.Next(0, JitterMaxValueMsecs);
            var sleepMultiplier = (int)(Math.Pow(2.0, Math.Min(retryAttempt, backoffLimit)));
            if (sleepMultiplier > 0)
            {
                sleepMsecs = sleepMsecs * sleepMultiplier;
                sleepMsecs += jitterMsecs;
                sleepMsecs = sleepMsecs < 0 ? int.MaxValue : sleepMsecs;
            }
            else
            {
                sleepMsecs = int.MaxValue;
            }

            return sleepMsecs;
        }
    }
}
