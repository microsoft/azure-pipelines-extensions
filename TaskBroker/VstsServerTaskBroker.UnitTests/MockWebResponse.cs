using System.Net;

namespace VstsServerTaskHelper.UnitTests
{
    public class MockWebResponse: HttpWebResponse
    {
        private HttpStatusCode m_StatusCode;

        public override long ContentLength
        {
            get
            {
                return 0;
            }
        }
        public override string ContentType
        {
            get
            {
                return string.Empty;
            }
        }

        public override HttpStatusCode StatusCode
        {
            get
            {
                return m_StatusCode;
            }
        }

        public MockWebResponse(HttpStatusCode statusCode)
        {
            m_StatusCode = statusCode;
        }
    }
}
