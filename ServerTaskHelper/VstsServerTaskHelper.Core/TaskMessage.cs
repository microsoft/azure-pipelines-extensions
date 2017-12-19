using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace VstsServerTaskHelper.Core
{
    public class TaskMessage
    {
        public Guid ProjectId { get; }
        public string HubName { get; }
        public Guid PlanId { get; }
        public Uri PlanUri { get; }
        public Guid JobId { get; }
        public Guid TimelineId { get; }
        public Guid TaskInstanceId { get; set; }
        public string TaskInstanceName { get; }
        public string AuthToken { get; }
        public RequestType RequestType { get; }

        private static readonly List<string> MandatoryProperties = new List<string>
        {
            ProjectIdKey,
            PlandIdKey,
            PlanUrlKey,
            JobIdKey,
            TimelineIdKey,
            AuthTokenKey,
        };

        public static readonly List<string> PropertiesList = new List<string>(MandatoryProperties)
        {
            HubNameKey,
            TaskInstanceIdKey,
            TaskInstanceNameKey,
            RequestTypeKey,
        };

        public TaskMessage(IDictionary<string, string> messageProperties)
        {
            var missingProperties = MandatoryProperties
                .Where(propertyToCheck => !messageProperties.ContainsKey(propertyToCheck)).ToList();
            if (missingProperties.Any())
            {
                var exceptionMessage =
                    $"Required properties '{string.Join(", ", missingProperties)}' are missing. Please provide these values and try again.";
                throw new InvalidDataException(exceptionMessage);
            }

            this.ProjectId = ParseGuid(messageProperties, ProjectIdKey);
            this.JobId = ParseGuid(messageProperties, JobIdKey);
            this.PlanId = ParseGuid(messageProperties, PlandIdKey);
            this.TimelineId = ParseGuid(messageProperties, TimelineIdKey);

            this.TaskInstanceId = messageProperties.ContainsKey(TaskInstanceIdKey)
                ? ParseGuid(messageProperties, TaskInstanceIdKey)
                : Guid.Empty;

            this.HubName = "Release";
            if (messageProperties.ContainsKey(HubNameKey))
            {
                this.HubName = messageProperties[HubNameKey];
            }
            if (!validHubNameList.Contains(this.HubName, StringComparer.OrdinalIgnoreCase))
            {
                var exceptionMessage = $"Invalid hub name '{this.HubName}'. Please provide valid hub name from '{string.Join(", ", validHubNameList)}'.";
                throw new InvalidDataException(exceptionMessage);
            }

            var planUrl = messageProperties[PlanUrlKey];
            if (!Uri.TryCreate(planUrl, UriKind.Absolute, out var planUri))
            {
                var exceptionMessage = $"Invalid plan url '{planUrl}'. Please provide a valid url and try again.";
                throw new InvalidDataException(exceptionMessage);
            }
            this.PlanUri = planUri;

            this.AuthToken = messageProperties[AuthTokenKey];

            var requestTypeString = RequestType.Execute.ToString();
            if(messageProperties.ContainsKey(RequestTypeKey))
            {
                requestTypeString = messageProperties[RequestTypeKey];
            }
            if (Enum.TryParse<RequestType>(requestTypeString, out var requestType))
            {
                this.RequestType = requestType;
            }

            if (messageProperties.ContainsKey(TaskInstanceNameKey) &&
                !string.IsNullOrEmpty(messageProperties[TaskInstanceNameKey]))
            {
                this.TaskInstanceName = messageProperties[TaskInstanceNameKey];
            }
            else
            {
                this.TaskInstanceName = "Undefined";
            }
        }

        private static Guid ParseGuid(IDictionary<string, string> messageProperties, string propertyName)
        {
            var messageProperty = messageProperties[propertyName];
            if (!Guid.TryParse(messageProperty, out var projectId))
            {
                throw new InvalidDataException($"Invalid guid value '{messageProperty}' provided for {propertyName}");
            }

            return projectId;
        }

        private readonly List<string> validHubNameList = new List<string> { "Build", "Release" };
        private const string ProjectIdKey = "ProjectId";
        private const string JobIdKey = "JobId";
        private const string PlandIdKey = "PlanId";
        private const string TimelineIdKey = "TimelineId";
        private const string TaskInstanceIdKey = "TaskInstanceId";
        private const string HubNameKey = "HubName";
        private const string PlanUrlKey = "PlanUrl";
        private const string AuthTokenKey = "AuthToken";
        private const string RequestTypeKey = "RequestType";
        private const string TaskInstanceNameKey = "TaskInstanceName";
    }
}