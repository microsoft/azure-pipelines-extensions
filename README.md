# Azure Pipeline extensions for Azure DevOps

This repository is a common place for some extensions that Azure DevOps team publishes as **Microsoft** or **Microsoft DevLabs** publisher.

## Dev Setup

### Prerequisites

In order to build and package extensions you will need to install some dependencies first.

- Ensure you have installed Node.js
- Run `npm -g install gulp-cli`
- Run `npm install -g tfx-cli`
- Run `npm install -g vsts-npm-auth`
- Run `vsts-npm-auth -config .npmrc` to setup authentication for npm (might be needed if you need to install packages for certain tasks within an extension))

### How to Build

. From the root folder of the repository run the following commands:

- `npm install` will install all the node modules required to run gulp to package, build etc.
- `gulp build`  will copy each task to "_build" folder, and install it's dependencies locally (wrt to the task) and copies the common modules required to run the task.
  - `gulp build` also runs `gulp tscBuildTasks` to execute task-specific TypeScript validation (`tsc -p`) for selected task folders.
  - The list of task folders included in this validation is configured in `externals.json` under `tsc-build-check`.
  - Run `gulp tscBuildTasks` directly if you want to validate only the task-specific TypeScript checks without running the full build.
  - Use `--syncVersions` to automatically bump the `version` field in `vss-extension.json` so it is higher than what is currently published on the Marketplace. This avoids pipeline failures caused by version conflicts.
    - Single extension: `gulp build --syncVersions <ExtensionName>`. For example `gulp build --syncVersions Ansible`
    - Multiple extensions (comma-separated): `gulp build --syncVersions <ExtensionName1>,<ExtensionName2>`. For example `gulp build --syncVersions Ansible,IISWebAppDeploy`
  - Ensure you run the command with sufficient permissions (e.g. open PowerShell as Administrator), as Azure CLI may need access to protected directories.
  - You may be prompted to log in to Azure (`az login`) because `--syncVersions` requires an access token to query the Marketplace API. The login prompt will open automatically in the browser if your session has expired.
- `gulp test` will run all pester or mocha tests written for each task, in the Tests folder.

### How to package extensions

You'll have to run `gulp build` and `gulp test` before you start packaging.

- `gulp package` will package all the extensions and stores them in "_package" folder.
- `gulp package --publisher=<publisher_name>` will package all the extensions under a new publisher name that you specify in "_package" folder.
- `gulp package --extension=<extension_name>` will package the single extension you mention, and stores it in "_package" folder.

## Contribution guideline

While updating an extension or its tasks it is important to ensure that:

1. The appropriate version number is updated

    - For any changed task, we need to update the version number for both, the changed task (in `task.json` file) and extension itself (in `vss-extension.json` file).
    - If only logic around the extension is changed, update the version number for extension only (in `vss-extension.json` file).
    - **If a shared/common file is changed, update the version number for ALL publishable extensions.** Shared infrastructure files can introduce regressions across all extensions, so a version bump ensures each extension is re-validated and re-published. Shared files include:
      - `Extensions/Common/`, `Extensions/ArtifactEngine/`, `Extensions/ArtifactEngineV2/`
      - Root config files: `package.json`, `package-lock.json`, `gulpfile.js`, `tsconfig.json`, `common.json`, `externals.json`, `package.js`, `package-utils.js`, `base.tsconfig.json`
      - Directories: `definitions/`, `TaskModules/`, `scripts/`, `.pipelines/`, `ci/`
      - Note: Documentation files (`.md`, `.txt`) and images (`.png`, `.jpg`, `.gif`) in these paths are excluded from this rule.
    - The version number consist of three parts (major, minor, patch). Be aware that minor number should reflect [the current sprint](https://whatsprintis.it/) of Azure DevOps team in which change is being made. Patch number starts from 0 for the initial version, and increments for every change.

2. The changed extension is published to [Marketplace](https://marketplace.visualstudio.com/azuredevops/).
   It is not enough to only merge change to `master` branch, without properly testing the current version and publishing it to all customers.

3. Delete your branch after pull request is merged.

## Updating Feed

Feed with various nugets to consume resides at [this location](https://1essharedassets.visualstudio.com/1esPkgs/_packaging?_a=feed&feed=vsts_rm_extensions)

Feed can be updated/republished by executing [this build definition](https://dev.azure.com/mseng/AzureDevOps/_build?definitionId=6226&_a=summary)