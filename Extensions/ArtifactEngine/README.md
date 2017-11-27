# Artifact Engine

## Overview
Artifact engine is a generic framework which supports download of artifacts from different providers like *jenkins, teamcity, vsts, bitbucket* e.t.c. The framework is extensible and other providers can be easily plugged in the downloader.

## How to Use
To use Artifact engine in your tasks or app have a look at [E2E.ts](E2ETests/E2E.ts).

## Architecture
<img src="https://cdn.rawgit.com/omeshp/ItemLevelDownloader/f7a2d1a1/src/sequence.svg" height=600 width=800/>

## Development
*Build*
1. Run npm install in ArtifactEngine folder
2. Use command ctrl-shift-b to build from vscode

*Testing*
1. Install [mocha sidebar](https://marketplace.visualstudio.com/items?itemName=maty.vscode-mocha-sidebar) extension to run tests from vscode.
2. Optional install [node tdd](https://marketplace.visualstudio.com/items?itemName=prashaantt.node-tdd) extension to automatically run tests on build.
