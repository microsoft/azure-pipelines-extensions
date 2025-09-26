# Azure Pipeline extensions for Azure DevOps

This repository is a common place for some extensions that Azure DevOps team publishes as **Microsoft** or **Microsoft DevLabs** publisher.

## Dev Setup

### Prerequisites

In order to build and package extensions you will need to install some dependencies first.

- Ensure you have installed Node.js
- Run `npm -g install gulp-cli`
- Run `npm install -g tfx-cli`

### How to Build

. From the root folder of the repository run the following commands:

- `npm install` will install all the node modules required to run gulp to package, build etc.
- `gulp build`  will copy each task to "_build" folder, and install it's dependencies locally (wrt to the task) and copies the common modules required to run the task.
- `gulp test` will run all pester or mocha tests written for each task, in the Tests folder.

### How to package extensions

You'll have to run `gulp build` and `gulp test` before you start packaging.

- `gulp package` will package all the extensions and stores them in "_package" folder.
- `gulp package --publisher=<publisher_name>` will package all the extensions under a new publisher name that you specify in "_package" folder.
- `gulp package --extension=<extension_name>` will package the single extension you mention, and stores it in "_package" folder.
- PS: Tested the compatibility with node version 10.22.0 on a windows machine.

## Contribution guideline

While updating an extension or its tasks it is important to ensure that:

1. The appropriate version number is updated

    - For any changed task, we need to update the version number for both, the changed task (in `task.json` file) and extension itself (in `vss-extension.json` file).
    - If only logic around the extension is changed, update the version number for extension only (in `vss-extension.json` file).
    - The version number consist of three parts (major, minor, patch). Be aware that minor number should reflect [the current sprint](https://whatsprintis.it/) of Azure DevOps team in which change is being made. Patch number starts from 0 for the initial version, and increments for every change.

2. The changed extension is published to [Marketplace](https://marketplace.visualstudio.com/azuredevops/).
   It is not enough to only merge change to `master` branch, without properly testing the current version and publishing it to all customers.

3. Delete your branch after pull request is merged.

## Updating Feed

Feed with various nugets to consume resides at [this location](https://1essharedassets.visualstudio.com/1esPkgs/_packaging?_a=feed&feed=vsts_rm_extensions)

Feed can be updated/republished by executing [this build definition](https://dev.azure.com/mseng/AzureDevOps/_build?definitionId=6226&_a=summary)