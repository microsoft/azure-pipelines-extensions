# Artifact Engine

## Overview
Artifact engine is a generic framework which supports download of artifacts from different providers like *jenkins, teamcity, vsts, github-releases* etc.
The framework is extensible and other providers can be easily plugged in the downloader.

## How to Use
To use Artifact engine in your tasks or app have a look at [E2E.ts](E2ETests/jenkins.e2e.ts
).

## Usage
![Daily downloads using artifact engine](https://github.com/Microsoft/azure-pipelines-extensions/blob/master/Extensions/ArtifactEngine/usage.png)

### External-output logging

`ArtifactEngineOptions.vsoCommandMode` controls handling of agent logging-command
markers in external log messages. The pipeline feature
`EnableArtifactEngineExternalOutput` must also be enabled (the task receives
`DISTRIBUTEDTASK_TASKS_ENABLEARTIFACTENGINEEXTERNALOUTPUT=true`).

```ts
const options = new ArtifactEngineOptions();
options.vsoCommandMode = 'blockAndTelemetry';
await engine.processItems(sourceProvider, destinationProvider, options);
```

| Mode | External-output behavior when the feature is enabled |
| --- | --- |
| `disabled` (default) | Neither block commands nor report command telemetry. |
| `telemetryOnly` | Report commands without blocking them. |
| `blockOnly` | Block commands without command telemetry. |
| `blockAndTelemetry` | Block commands and report command telemetry. |

The feature is off when absent. With the feature off, external messages use the
original logging behavior regardless of the mode. Enabling the feature alone is
not a mitigation: the caller must explicitly select a blocking mode.
`telemetryOnly` is observation, not protection.

For library contributors, use `Logger.info`, `Logger.error`, and `Logger.message`
for external or mixed-origin messages, including artifact paths, metadata,
response bodies, and error text. These methods use task-lib's external-output
helpers, preserving debug, error, and ordinary output respectively:

```ts
Logger.message(tl.loc('DownloadingTo', item.path, outputItemPath));
```

Keep `Logger.logInfo`, `Logger.logError`, and `Logger.logMessage` for trusted
internal messages. A trusted format string does not make interpolated external
values trusted. Only the logged text is filtered; artifact data and paths are
not modified. The verbose summary's artifact-path row uses the external API;
internal counts, progress, headings, and intentional telemetry commands do not.

The logging mode is process-wide static Logger state, like `verbose`.
Each `processItems` invocation resets it, including when options are omitted.
Concurrent engine runs with different modes are not isolated.

Consuming tasks must update their bundled library and explicitly pass a mode.
Server-side feature registration/propagation and package/task rollout are
separate from this library change. Existing task-level output filtering should
not be removed as part of adopting this API.

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
