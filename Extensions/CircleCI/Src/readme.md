# CircleCI&trade; artifacts for Release management

This extension is an integration point for CircleCI&trade; with Release management in VS Team Services. With this extension, you can deploy artifacts from CircleCI&trade; builds using Release management. 

**Note:** This extension work only with VS Team Services and TFS "15" RC onwards.

## Usage
This extension provides a service endpoint to connect to CircleCI&trade; account. Once connected, you can link a build artifact from the CircleCI&trade; project and deploy the same using Release management orchestration service.

### Connecting to a CircleCI&trade; project
Go to project settings -> Services tab and create a New Service Endpoint of type **CircleCI&trade":
![Creating a CircleCI&trade; endpoint connection](images/screen1.png)


### Linking a CircleCI&trade; build
Once you have set up the service endpoint connection, you would be able to link an external TFS/VS-Team-Services build artifact in your release definition
![Linking CircleCI&trade; artifact](images/screen2.png)

[Learn more about artifacts in Release Management](https://msdn.microsoft.com/library/vs/alm/release/author-release-definition/understanding-artifacts). Also you can use [Azure Pipeline Extensions on Github](https://github.com/Microsoft/azure-pipelines-extensions/issues) to report any issues.

**Note: ** CircleCI&trade; is trademark owned by Jetbrains s.r.o.

