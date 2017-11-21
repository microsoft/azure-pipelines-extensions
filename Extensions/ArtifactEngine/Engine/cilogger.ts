var tl = require('vsts-task-lib');

const area: string = 'artifact-engine';

function getDefaultProps() {
    return {
        releaseuri: tl.getVariable('Release.ReleaseUri'),
        releaseid: tl.getVariable('Release.ReleaseId'),
        builduri: tl.getVariable('Build.BuildUri'),
        buildid: tl.getVariable('Build.Buildid')
    };
}

export function publishEvent(feature, properties: { [key: string]: any }): void {
    try {
        tl.assertAgent('2.125.0');
        tl.publishTelemetry(area, feature, Object.assign(getDefaultProps(), properties));
    } catch (err) {
        tl.debug('Unable to publish telemetry due to lower agent version.');
    }
}