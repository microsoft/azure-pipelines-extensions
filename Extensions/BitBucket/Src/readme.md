# Bitbucket&reg; artifacts for Release management

This extension is an integration point for Bitbucket&reg; with Release management in Azure DevOps. With this extension, you can deploy sources from Bitbucket&reg; repositories using Release management. 

**Note:** This extension work only with Azure DevOps and TFS "18" RC onwards. 

## Usage
This extension provides a service endpoint to connect to Bitbucket&reg; account. Once connected, you can link a repositories from the Bitbucket&reg; and deploy the same using Release management orchestration service.

### Connecting to a Bitbucket&reg; project
Go to project settings -> Services tab and create a New Service Endpoint of type Bitbucket&reg;
![Creating a Bitbucket&reg; endpoint connection](images/screen1.png)


### Linking a Bitbucket&reg; sources
Once you have set up the service endpoint connection, you would be able to link an external Bitbucket&reg; sources in your release definition
![Linking Bitbucket&reg; artifact](images/screen2.png)

[Learn more about artifacts in Release Management](https://msdn.microsoft.com/library/vs/alm/release/author-release-definition/understanding-artifacts). Also you can use [Azure Pipeline Extensions on Github](https://github.com/Microsoft/azure-pipelines-extensions/issues) to report any issues.

**Note:** Bitbucket&reg; is trademark owned by Atlassian.
