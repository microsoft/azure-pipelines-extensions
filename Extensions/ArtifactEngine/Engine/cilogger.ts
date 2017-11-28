import { error } from "util";

var tl = require('vsts-task-lib');
var packagejson = require('../package.json');

const area: string = 'artifact-engine';

function getDefaultProps() {
    return {
        serverurl: tl.getVariable('System.TEAMFOUNDATIONSERVERURI'),
        releaseurl: tl.getVariable('Release.ReleaseWebUrl'),
        taskDisplayName: tl.getVariable('Task.DisplayName'),
        jobid: tl.getVariable('System.Jobid'),
        releaseid: tl.getVariable('Release.ReleaseId'),
        builduri: tl.getVariable('Build.BuildUri'),
        buildid: tl.getVariable('Build.Buildid'),
        agentVersion: tl.getVariable('Agent.Version'),
        version: packagejson.version
    };
}

export function publishEvent(feature, properties: any | IReliabilityData): void {
    try {
        var splitVersion = (process.env.AGENT_VERSION || '').split('.');
        var major = parseInt(splitVersion[0] || '0');
        var minor = parseInt(splitVersion[1] || '0');
        let telemetry = '';
        if (major > 2 || (major == 2 && minor >= 120)) {
            telemetry = `##vso[telemetry.publish area=${area};feature=${feature}]${JSON.stringify(Object.assign(getDefaultProps(), properties))}`;
        }
        else {
            if (feature === 'reliability') {
                let reliabilityData = <IReliabilityData>properties;
                telemetry = "##vso[task.logissue type=error;code=" + reliabilityData.issueType + ";agentVersion=" + tl.getVariable('Agent.Version') + ";taskId=" + area + "-" + packagejson.version + ";]" + reliabilityData.errorMessage
            }
        }
        console.log(telemetry);;
    }
    catch (err) {
        tl.warning("Failed to log telemetry, error: " + err);
    }
}

export interface IReliabilityData {
    issueType: string
    errorMessage: string
    stack: string
}