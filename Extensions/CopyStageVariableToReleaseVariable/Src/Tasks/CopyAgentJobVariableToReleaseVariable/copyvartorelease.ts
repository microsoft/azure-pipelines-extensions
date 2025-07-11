import tl = require('azure-pipelines-task-lib/task');
const azdev = require('azure-devops-node-api');
import * as ReleaseApi from 'azure-devops-node-api/ReleaseApi';
import * as ReleaseInterfaces from 'azure-devops-node-api/interfaces/ReleaseInterfaces';

async function run() {
    try {
        const stageVariableNamesArray = tl.getDelimitedInput("stageVariableNames", ',', true);
        const releaseVariableNames = tl.getInput("releaseVariableNames", false);
        let releaseVariableNamesArray: string[] = [];

        if (!!releaseVariableNames) {
            releaseVariableNamesArray = releaseVariableNames.split(',');

            if (releaseVariableNamesArray.length != stageVariableNamesArray.length) {
                throw new Error(tl.loc("ReleaseVarLengthShoulbeSameAsStageVarLength"));
            }
        } else {
            tl.debug("Creating release variables with the same name as the stage variables");
            releaseVariableNamesArray = stageVariableNamesArray;
        }

        const collectionUri = tl.getVariable("System.CollectionUri");
        const teamProject = tl.getVariable("System.TeamProject")!;
        const releaseId = Number(tl.getVariable("Release.ReleaseId"))!;

        const accessToken = tl.getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'ACCESSTOKEN', false)!;

        if (!accessToken) {
            throw new Error(tl.loc("JS_AccessTokenNotAvailable"));
        }

        const authHandler = azdev.getHandlerFromToken(accessToken);
        const connection = new azdev.WebApi(collectionUri, authHandler);
        const releaseApiObject: ReleaseApi.IReleaseApi = await connection.getReleaseApi();

        tl.debug("Get release");

        let release: ReleaseInterfaces.Release;

        try {
            release = await releaseApiObject.getRelease(teamProject, releaseId);
        } catch(error) {
            throw new Error(tl.loc("FailedToFetchRelease", error));
        }

        for (let i = 0; i < stageVariableNamesArray.length; i++) {
            const configurationVariableValue: ReleaseInterfaces.ConfigurationVariableValue = {};
            configurationVariableValue.value = tl.getVariable(stageVariableNamesArray[i]);
            console.log(tl.loc("JS_AssignReleaseVariable", stageVariableNamesArray[i], releaseVariableNamesArray[i]));
            release.variables![releaseVariableNamesArray[i]] = configurationVariableValue;
        }

        try {
            const updatedRelease = await releaseApiObject.updateRelease(release, teamProject, releaseId);
            console.log(tl.loc("JS_UpdatedRelease", updatedRelease.id));
        } catch(error) {
            throw new Error(tl.loc("FailedToUpdateRelease", error));
        }
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message || 'run() failed');
    }
}

run();
