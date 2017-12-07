using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace VstsServerTaskHelper
{
    [SuppressMessage("Microsoft.StyleCop.CSharp.DocumentationRules", "SA1650:ElementDocumentationMustBeSpelledCorrectly", Justification = "GIT and Auth are fine")]
    [SuppressMessage("Microsoft.StyleCop.CSharp.DocumentationRules", "SA1609:PropertyDocumentationMustHaveValue", Justification = "really not required")]
    public class VstsMessage
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
        /// Gets or sets the requester email for scheduled build/release
        /// </summary>
        public string ScheduleRequesterAlias { get; set; }

        /// <summary>
        /// Gets or sets the requester email id.
        /// </summary>
        public string RequesterEmail { get; set; }

        /// <summary>
        /// Gets or sets the requestor name [FirstName LastName].
        /// </summary>
        public string RequesterName { get; set; }

        /// <summary>
        /// Gets or sets the VSTS user Id.
        /// </summary>
        public Guid RequesterId { get; set; }

        /// <summary>
        /// Gets or sets the name of the VSTS project name.
        /// </summary>
        public string ProjectName { get; set; }

        /// <summary>
        /// Gets or sets the Id of the VSTS team project.
        /// </summary>
        public Guid ProjectId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Timeline Job ID.
        /// </summary>
        public Guid JobId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS timeline Id.
        /// </summary>
        public Guid TimelineId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS plan Id.
        /// </summary>
        public Guid PlanId { get; set; }

        /// <summary>
        /// Gets or sets the URI for build/release Plan APIs
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
        /// Gets or sets the URI for build/release plan APIs
        /// </summary>
        public Uri VstsPlanUri { get; set; }

        /// <summary>
        /// Gets or sets the authToken for the given build/release request.
        /// This token will be used to send the plan progress updates back to VSTS.
        /// </summary>
        public string AuthToken { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the job can be marked as completed.
        /// Set CompleteSychronously to true to mark the job as completed
        /// right after the Execute message is processed.
        /// </summary>
        public bool CompleteSychronously { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether to skip raising Plan Events. 
        /// </summary>
        public bool SkipRaisePlanEvents { get; set; }

        /// <summary>
        /// Gets or sets the task log id. This value is set internally and should not be set from the task.
        /// </summary>
        public int TaskLogId { get; set; }

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
