# Artifact Engine

## Overview
Artifact engine is a generic framework which supports download of artifacts from different providers like *jenkins, teamcity, vsts, circleci, github-releases* e.t.c. The framework is extensible and other providers can be easily plugged in the downloader.

## How to Use
To use Artifact engine in your tasks or app have a look at [E2E.ts](E2ETests/jenkins.e2e.ts
).

## Usage
![Daily downloads using artifact engine](https://github.com/Microsoft/azure-pipelines-extensions/blob/master/Extensions/ArtifactEngine/usage.png)

## Architecture
![Architecture](https://github.com/Microsoft/azure-pipelines-extensions/blob/master/Extensions/ArtifactEngine/sequence.svg)

## Development
**Build**
---------
1. Run npm install in ArtifactEngine folder
2. Use command ctrl-shift-b to build from vscode

**Testing**
----------
*vscode*
----------
1. Install [mocha sidebar](https://marketplace.visualstudio.com/items?itemName=maty.vscode-mocha-sidebar) extension to run tests from vscode.
2. Optional install [node tdd](https://marketplace.visualstudio.com/items?itemName=prashaantt.node-tdd) extension to automatically run tests on build.

*gulp*
------
1. To run ArtifactEngine integration and unit tests from root directory use

    `gulp test --suite=ArtifactEngine`
2. To run Performance tests update [test config file](test.config.json.example) and rename it to test.config.json  and run

    `gulp test --suite=ArtifactEngine --perf`
3. To run End-to-End tests update [test config file](test.config.json.example) and rename it to test.config.json  and run

    `gulp test --suite=ArtifactEngine --e2e`
