# Demo&trade; artifacts for Release Management

This extension is an integration point for Demo&trade; with Release management in VS Team Services. With this extension, you can deploy artifacts from Demo&trade; builds using Release management. 

**Note:** This extension work only with VS Team Services and TFS "15" RC onwards.

## Usage
This extension provides a service endpoint to connect to Demo&trade; account. Once connected, you can link a artifact from the Demo&trade; and deploy the same using Release management orchestration service.

### Connecting to a Demo&trade; project
Go to project settings -> Services tab and create a New Service Endpoint of type Demo&trade;:

### Linking a Demo&trade; artifact
Once you have set up the service endpoint connection, you would be able to link an Demo&trade; artifact in your release definition

[Learn more about artifacts in Release Management](https://msdn.microsoft.com/library/vs/alm/release/author-release-definition/understanding-artifacts). 

