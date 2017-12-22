using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;
using VstsServerTaskHelper.Core;

namespace VstsServerTaskHelper.HttpRequestHandler
{
    public static class HeaderDictionaryExtensions
    {
        public static IDictionary<string, string> GetTaskPropertiesDictionary(this IHeaderDictionary headerDictionary)
        {
            return TaskMessage.PropertiesList.Where(headerDictionary.ContainsKey)
                .ToDictionary<string, string, string>(expectedTaskProperty => expectedTaskProperty,
                    expectedTaskProperty => headerDictionary[expectedTaskProperty]);
        }

    }
}
