using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace VstsServerTaskBroker.Contracts
{
    public enum RequestType
    {
        Execute,
        Cancel
    }

    public enum HubType
    {
        Release,
        Build
    }

    public class VstsPlanProperties
    {
        /// <summary>
        /// Gets or sets the task log id. This value is set internally and should not be set from the task.
        /// </summary>
        public int TaskLogId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS build definition plan Id.
        /// </summary>
        public Guid PlanId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Hub.
        /// </summary>
        public HubType VstsHub { get; set; }

        /// <summary>
        /// Gets or sets the VSTS project name.
        /// </summary>
        public string ProjectName { get; set; }

        /// <summary>
        /// Gets or sets the VSTS project id.
        /// </summary>
        public Guid ProjectId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Build Job ID.
        /// </summary>
        public Guid JobId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Build timeline Id.
        /// </summary>
        public Guid TimelineId { get; set; }

        /// <summary>
        /// Gets or sets the URL for Build/Release Plan APIs.
        /// </summary>
        public string VstsPlanUrl { get; set; }

        /// <summary>
        /// Gets or sets the URI for Build/Release Plan APIs.
        /// </summary>
        public Uri VstsPlanUri { get; set; }

        /// <summary>
        /// Gets or sets the URL of the team foundation collection.
        /// </summary>
        public string VstsUrl { get; set; }

        /// <summary>
        /// Gets or sets the URI of the team foundation collection.
        /// </summary>
        public Uri VstsUri { get; set; }

        /// <summary>
        /// Gets or sets the authToken for the given build request.
        /// This token will be used to send the build progress updates back to VSTS.
        /// </summary>
        public string AuthToken { get; set; }
    }

    public class VstsRequesterProperties
    {
        /// <summary>
        /// Gets or sets the requester email for scheduled builds
        /// </summary>
        public string ScheduleBuildRequesterAlias { get; set; }

        /// <summary>
        /// Gets or sets the VSTS build requester email id.
        /// </summary>
        public string RequesterEmail { get; set; }

        /// <summary>
        /// Gets or sets the VSTS build requestor name [FirstName LastName].
        /// </summary>
        public string RequesterName { get; set; }

        /// <summary>
        /// Gets or sets the VSTS user Id.
        /// </summary>
        public Guid RequesterId { get; set; }
    }

    public class VstsBuildProperties
    {
        /// <summary>
        /// Gets or sets the VSTS Build ID.
        /// </summary>
        public int BuildId { get; set; }

        /// <summary>
        /// Gets or sets the name of the build definition.
        /// </summary>
        public string BuildName { get; set; }

        /// <summary>
        /// Gets or sets the latest version control change that is included in this build.
        /// Git: The commit ID.
        /// TFVC: the changeset.
        /// </summary>
        public string SourceVersion { get; set; }

        /// <summary>
        /// Gets or sets the branch the build was queued for.
        /// </summary>
        public string SourceBranch { get; set; }

        /// <summary>
        /// Gets or sets the Source Control Server.
        /// </summary>
        public string SourceControlServerUri { get; set; }

        /// <summary>
        /// Gets or sets the name of the repository.
        /// </summary>
        public string RepositoryName { get; set; }
    }

    public class VstsReleaseProperties
    {
        /// <summary>
        /// Gets or sets the VSTS Release ID.
        /// </summary>
        public int ReleaseId { get; set; }

        /// <summary>
        /// Gets or sets the name of the release.
        /// </summary>
        public string ReleaseName { get; set; }

        /// <summary>
        /// Gets or sets the name of the release definition
        /// </summary>
        public string ReleaseDefinitionName { get; set; }

        /// <summary>
        /// Gets or sets the name of the release environment
        /// </summary>
        public string ReleaseEnvironmentName { get; set; }

        /// <summary>
        /// Gets or sets the URL for the release environment
        /// </summary>
        public Uri ReleaseEnvironmentUri { get; set; }

        /// <summary>
        /// Gets or sets the URL for the release
        /// </summary>
        public Uri ReleaseUri { get; set; }
    }

    [SuppressMessage("Microsoft.StyleCop.CSharp.DocumentationRules", "SA1650:ElementDocumentationMustBeSpelledCorrectly", Justification = "GIT and Auth are fine")]
    [SuppressMessage("Microsoft.StyleCop.CSharp.DocumentationRules", "SA1609:PropertyDocumentationMustHaveValue", Justification = "really not required")]
    public class VstsMessageBase
    {
        /// <summary>
        /// Gets or sets the VSTS Build properties 
        /// </summary>
        public VstsBuildProperties BuildProperties { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Release properties
        /// </summary>
        public VstsReleaseProperties ReleaseProperties { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Plan properties
        /// </summary>
        public VstsPlanProperties PlanProperties { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Requester properties
        /// </summary>
        public VstsRequesterProperties RequesterProperties { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Hub 
        /// </summary>
        public HubType VstsHub { get; set; }

        /// <summary>
        /// Gets or sets the VSTS agent less task version.
        /// </summary>
        public string TaskVersion { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Request Type which can be Execute or Cancel.
        /// </summary>
        public RequestType RequestType { get; set; }

        /// <summary>
        /// Gets or sets the requester email for scheduled builds
        /// </summary>
        public string ScheduleBuildRequesterAlias { get; set; }

        /// <summary>
        /// Gets or sets the VSTS build requester email id.
        /// </summary>
        public string RequesterEmail { get; set; }

        /// <summary>
        /// Gets or sets the VSTS build requestor name [FirstName LastName].
        /// </summary>
        public string RequesterName { get; set; }

        /// <summary>
        /// Gets or sets the VSTS user Id.
        /// </summary>
        public Guid RequesterId { get; set; }

        /// <summary>
        /// Gets or sets the name of the VSTS repository.
        /// </summary>
        public string ProjectName { get; set; }

        /// <summary>
        /// Gets or sets the Id of the team project that this build belongs to.
        /// </summary>
        public Guid ProjectId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Build Job ID.
        /// </summary>
        public Guid JobId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Build timeline Id.
        /// </summary>
        public Guid TimelineId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS build definition plan Id.
        /// </summary>
        public Guid PlanId { get; set; }

        /// <summary>
        /// Gets or sets the URI for Build/Release Plan APIs
        /// </summary>
        public string VstsPlanUrl { get; set; }

        /// <summary>
        /// Gets or sets the URI of the team foundation collection.
        /// </summary>
        public string VstsUrl { get; set; }

        /// <summary>
        /// Gets or sets the URI of the team foundation collection.
        /// </summary>
        public Uri VstsUri { get; set; }

        /// <summary>
        /// Gets or sets the URI for Build/Release Plan APIs
        /// </summary>
        public Uri VstsPlanUri { get; set; }

        /// <summary>
        /// Gets or sets the authToken for the given build request.
        /// This token will be used to send the build progress updates back to VSTS.
        /// </summary>
        public string AuthToken { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the job can be marked as completed.
        /// Set CompleteSychronously to true to mark the job as completed
        /// right after the Execute message is processed.
        /// </summary>
        public bool CompleteSychronously { get; set; }

        /// <summary>
        /// Gets or sets the task log id. This value is set internally and should not be set from the task.
        /// </summary>
        public int TaskLogId { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether to skip raising Plan Events. 
        /// </summary>
        public bool SkipRaisePlanEvents { get; set; }

        public Guid TimelineRecordId { get; set; }

        public IDictionary<string, string> GetMessageProperties()
        {
            var messageProperties = new Dictionary<string, string>
            {
                {"VstsHub", this.VstsHub.ToString() },
                {"VstsJobId", this.JobId.ToString() },
                {"VstsPlanId", this.PlanId.ToString() },
                {"VstsProjectId", this.ProjectId.ToString() },
                {"VstsRequestType", this.RequestType.ToString() },
                {"VstsRequesterEmail", this.RequesterEmail },
                {"VstsProjectName", this.ProjectName },
            };

            if (this.BuildProperties != null)
            {
                messageProperties["VstsBuildId"] = this.BuildProperties.BuildId.ToString();
                messageProperties["VstsBuildName"] = this.BuildProperties.BuildName;
                messageProperties["VstsSourceVersion"] = this.BuildProperties.SourceVersion;
                messageProperties["VstsRepositoryName"] = this.BuildProperties.RepositoryName;
            }

            if (this.ReleaseProperties != null)
            {
                messageProperties["VstsReleaseId"] = this.ReleaseProperties.ReleaseId.ToString();
                messageProperties["VstsReleaseName"] = this.ReleaseProperties.ReleaseName;
                messageProperties["VstsReleaseDefinitionName"] = this.ReleaseProperties.ReleaseDefinitionName;
                messageProperties["VstsReleaseEnvironmentName"] = this.ReleaseProperties.ReleaseEnvironmentName;
            }

            return messageProperties;
        }
    }
}
