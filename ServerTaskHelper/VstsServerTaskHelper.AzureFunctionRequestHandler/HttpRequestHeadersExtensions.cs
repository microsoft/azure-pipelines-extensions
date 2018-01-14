using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using VstsServerTaskHelper.Core;

namespace VstsServerTaskHelper.AzureFunctionRequestHandler
{
    public static class HttpRequestHeadersExtensions
    {
        public static IDictionary<string, string> GetTaskPropertiesDictionary(this HttpRequestHeaders requestHeaders)
        {
            IDictionary<string, string> taskProperties = new Dictionary<string, string>();

            foreach (var taskProperty in TaskProperties.PropertiesList)
            {
                if (requestHeaders.TryGetValues(taskProperty, out var propertyValues))
                {
                    taskProperties.Add(taskProperty, propertyValues.First());
                }
            }

            return taskProperties;
        }
    }
}