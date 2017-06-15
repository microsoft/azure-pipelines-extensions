using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Threading.Tasks;   

namespace VstsServerTaskBroker
{
    /// <summary>
    /// A class that is responsible for retrying an action if it throws an exception.
    /// </summary>
    public class VstsTaskHttpRetryer
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
        /// List of HTTP transient error codes to retry.
        /// </summary>
        private readonly HashSet<HttpStatusCode> trasientHttpCodes = new HashSet<HttpStatusCode>()
        {
            HttpStatusCode.GatewayTimeout,
            HttpStatusCode.RequestTimeout,
            HttpStatusCode.ServiceUnavailable,
            HttpStatusCode.Forbidden,
            HttpStatusCode.Unauthorized,
            HttpStatusCode.InternalServerError,
            HttpStatusCode.NotFound,
        };

        private bool IsTrasientException(Exception e)
        {
			var ex = e as WebException;

            if (ex == null)
            {
                return false;
            }

			var response = ex.Response as HttpWebResponse;
			if (response == null)
			{
				return false;
			}

			return trasientHttpCodes.Contains(response.StatusCode);
        }

        /// <summary>
        /// Initializes an object of this class.
        /// </summary>
        /// <param name="numOfRetries">Number or retries for the action.</param>
        /// <param name="interval">Wait time between each retry.</param>
        /// <param name="transientStatusCodes">List of Http transient error codes to retry.</param>
        private VstsTaskHttpRetryer(int numOfRetries, TimeSpan interval, HashSet<HttpStatusCode> transientStatusCodes)
        {
            if (numOfRetries <= 0)
            {
                throw new ArgumentException("Number of retries must be greater or equal to zero");
            }

            if (transientStatusCodes != null)
            {
                this.trasientHttpCodes = transientStatusCodes;
            }

            this.numOfRetries = numOfRetries;
            this.interval = interval;
        }
        
        /// <summary>
        /// Creates a new instance of this class.
        /// </summary>
        /// <param name="numOfRetries">Number or retries for the action.</param>
        /// <param name="interval">Wait time between each retry.</param>
        /// <param name="transientStatusCodes">List of Http transient error codes to retry.</param>
        public static VstsTaskHttpRetryer CreateRetryer(int numOfRetries, TimeSpan interval, HashSet<HttpStatusCode> transientStatusCodes = null )
        {
            return new VstsTaskHttpRetryer(numOfRetries, interval, transientStatusCodes);
        }

        /// <summary>
        /// Starts running the given async action wrapped in retry logic.
        /// </summary>
        /// <param name="asyncAction">Function to run with retry logic.</param>
        /// <param name="retryEventHandler">Handler for success, retry and fail.</param>
        /// <param name="isNoThrow">Does not throw if set to true.</param>
        /// <param name="shouldRetry">Function to check if the exception should be retried.</param>
        /// <typeparam name="T">The output of the asyncAction.</typeparam>
        public async Task<T> TryActionAsync<T>(Func<Task<T>> asyncAction, IRetryEventHandler retryEventHandler = null, bool isNoThrow = false, Func<Exception, bool> shouldRetry = null)
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
                        retryEventHandler.Success(retries, sw.ElapsedMilliseconds);
                    }

                    return retval;
                }
                catch (Exception e)
                {
                    if (retries < numOfRetries && (shouldRetry == null || shouldRetry(e) || IsTrasientException(e)))
                    {
                        if (retryEventHandler != null)
                        {
                            retryEventHandler.Retry(e, retries, sw.ElapsedMilliseconds);
                        }

                        var sleepMSecs = ComputeWaitTimeWithBackoff(retries, interval.Milliseconds, numOfRetries);
                        Task.Delay(sleepMSecs).Wait();
                    }
                    else
                    {
                        if (retryEventHandler != null)
                        {
                            retryEventHandler.Fail(e, retries, sw.ElapsedMilliseconds);
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
