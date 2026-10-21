# Artifact Engine

## Overview
Artifact engine is a generic framework which supports download of artifacts from different providers like *jenkins, teamcity, vsts, github-releases* etc.
The framework is extensible and other providers can be easily plugged in the downloader.

## Artifact path matching
Include and exclude patterns match case-insensitively on Windows. On macOS, matching follows the destination filesystem's case sensitivity when the provider supports filesystem detection; otherwise it remains case-sensitive. Linux matching remains case-sensitive. This behavior does not require a pipeline feature flag.

## How to Use
To use Artifact engine in your tasks or app have a look at [E2E.ts](E2ETests/jenkins.e2e.ts
).

## Usage
![Daily downloads using artifact engine](https://github.com/Microsoft/azure-pipelines-extensions/blob/master/Extensions/ArtifactEngine/usage.png)

### External-output logging

Use `Logger.infoExternalOutput`, `Logger.errorExternalOutput`, and
`Logger.messageExternalOutput` for external or mixed-origin messages such as
artifact paths, metadata, remote responses, and error text. A trusted format
string does not make interpolated external data trusted.

The pipeline feature `EnableArtifactEngineExternalOutput` enables configurable
handling through task-lib's matching debug, error, and ordinary output helpers.
The task receives the feature as
`DISTRIBUTEDTASK_TASKS_ENABLEARTIFACTENGINEEXTERNALOUTPUT=true`.

```ts
const options = new ArtifactEngineOptions();
options.vsoCommandMode = 'blockAndTelemetry';
await engine.processItems(sourceProvider, destinationProvider, options);
```

| Mode | External-output behavior when the feature is enabled |
| --- | --- |
| `blockOnly` (V2 default) | Block commands without command telemetry. |
| `blockAndTelemetry` | Block commands and report command telemetry. |
| `telemetryOnly` | Report commands without blocking them. |
| `disabled` | Neither block commands nor report command telemetry. |

V2 defaults to `blockOnly`, preserving its existing blocking behavior for
ordinary messages. V1's compatibility default is `disabled`; do not assume
identical defaults across major versions. Explicitly choosing `disabled` or
`telemetryOnly` with the feature enabled opts out of blocking, including for
ordinary messages that V2 previously blocked.

With the feature absent or off, the new methods delegate to their corresponding
legacy methods. `Logger.logMessage` keeps its existing task-lib filtering and
native `os.EOL` newline, independently of the new mode. `Logger.logInfo` and
`Logger.logError` retain their existing debug/error behavior. Disabling the
feature does not disable V2's pre-existing ordinary-output protection.

Keep the legacy APIs for trusted internal messages. Only external/mixed-origin
call sites, including verbose artifact-path rows, use the new boundary. Internal
counts, progress, headings, worker status, and intentional telemetry remain
unchanged. Filtering changes only the logged copy, not artifact paths or data.

Logger's mode is process-wide static state, like `verbose`. Every `processItems`
call resets it, including when options or the property are omitted. Concurrent
engines with differing modes are not isolated.

Consuming-task updates, server-side feature registration/propagation, package
publication, and rollout are separate follow-ups. Keep existing task-level
filtering in place.

## Architecture
![Architecture](https://github.com/Microsoft/azure-pipelines-extensions/blob/master/Extensions/ArtifactEngine/sequence.svg)

## Development
**Build**
---------
1. Run npm install in ArtifactEngineV2 folder
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

    `gulp test --suite=ArtifactEngineV2`
2. To run Performance tests update [test config file](test.config.json.example) and rename it to test.config.json  and run

    `gulp test --suite=ArtifactEngineV2 --perf`
3. To run End-to-End tests update [test config file](test.config.json.example) and rename it to test.config.json  and run

    `gulp test --suite=ArtifactEngineV2 --e2e`
