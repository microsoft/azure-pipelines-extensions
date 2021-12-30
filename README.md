# Azure Pipeline extensions for Azure DevOps

This repository is a common place for some extensions that Azure DevOps team publishes as **Microsoft** or **Microsoft DevLabs** publisher.

## How to Build 

Ensure you have installed Node.js. Clone the repository, and go to the root folder of the repository and run the following commands. 

- `npm install` will install all the node modules required to run gulp to package, build etc.
- `gulp build`  will copy each task to "_build" folder, and install it's dependencies locally (wrt to the task) and copies the common modules required to run the task.
- `gulp test` will run all pester or mocha tests written for each task, in the Tests folder. 

## How to package extensions

You'll have to run `gulp build` and `gulp test` before you start packaging.

- `gulp package` will package all the extensions and stores them in "_package" folder.
- `gulp package --publisher=<publisher_name>` will package all the extensions under a new publisher name that you specify in "_package" folder.
- `gulp package --extension=<extension_name>` will package the single extension you mention, and stores it in "_package" folder.
- PS: Tested the compatibility with node version 10.22.0 on a windows machine. 

## Updating Feed

Feed with various nugets to consume resides at [this location](https://1essharedassets.visualstudio.com/1esPkgs/_packaging?_a=feed&feed=vsts_rm_extensions)

Feed can be updated/republished by executing [this build definition](https://dev.azure.com/mseng/AzureDevOps/_build?definitionId=6226&_a=summary)

## Contact Information

Extensions authored by **Microsoft** publisher are supported by Microsoft. The following extensions authored by **Microsoft DevLabs** publisher are not supported by Microsoft.

- Terraform
- Optimizely
- Google Analytics

To report a problem with a DevLabs extension, create an issue in this repository. The maintainers of this repository will review and respond to the issue.

You can also report problems or share feedback about DevLabs extensions on [Developer Community Forum](https://developercommunity.visualstudio.com/spaces/21/index.html).
