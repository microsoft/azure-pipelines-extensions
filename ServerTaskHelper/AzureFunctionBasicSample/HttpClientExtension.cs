using System;
using System.Text;
using System.Net.Http.Headers;
using System.Net.Http;
using System.Threading.Tasks;

namespace AzureFunctionBasicSample
{
    public static class HttpClientExtension
    {

        public static Task<HttpResponseMessage> GetAdoData(this HttpClient httpClient, string url, string authToken)
        {
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(
            ASCIIEncoding.ASCII.GetBytes(
                string.Format("{0}:{1}", "", authToken))));

            return httpClient.GetAsync(new Uri(url));
        }

        public static Task<HttpResponseMessage> PostData(this HttpClient httpClient, string url, string requestBody, string authToken)
        {
            var buffer = Encoding.UTF8.GetBytes(requestBody);
            var byteContent = new ByteArrayContent(buffer);
            byteContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(
            ASCIIEncoding.ASCII.GetBytes(
                string.Format("{0}:{1}", "", authToken))));

            return httpClient.PostAsync(new Uri(url), byteContent);
        }

        public static Task<HttpResponseMessage> PatchData(this HttpClient httpClient, string url, string requestBody, string authToken)
        {
            var buffer = Encoding.UTF8.GetBytes(requestBody);
            var byteContent = new ByteArrayContent(buffer);
            byteContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(
            ASCIIEncoding.ASCII.GetBytes(
                string.Format("{0}:{1}", "", authToken))));

            return httpClient.PatchAsync(new Uri(url), byteContent);
        }

        public static Task<HttpResponseMessage> GetData(this HttpClient httpClient, string url, string authToken)
        {
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(
            ASCIIEncoding.ASCII.GetBytes(
                string.Format("{0}:{1}", "", authToken))));

            return httpClient.GetAsync(new Uri(url));
        }
    }
}
