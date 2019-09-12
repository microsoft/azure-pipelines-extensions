import tl = require('./node_modules/azure-pipelines-task-lib/task');
const azdev = require('azure-devops-node-api'); 
import * as ReleaseApi from './node_modules/azure-devops-node-api/ReleaseApi';
import * as ReleaseInterfaces from './node_modules/azure-devops-node-api/interfaces/ReleaseInterfaces';

async function run() {
    try {
        var stageVariableNamesArray = tl.getDelimitedInput("stageVariableNames", ',', true);
        var releaseVariableNames = tl.getInput("releaseVariableNames", false);
        var releaseVariableNamesArray : string[] = [];
        if (!!releaseVariableNames)
        {
            releaseVariableNamesArray = releaseVariableNames.split(',');
            if(releaseVariableNamesArray.length != stageVariableNamesArray.length)
            {
                throw new Error(tl.loc("ReleaseVarLengthShoulbeSameAsStageVarLength"));
            }
        }
        else
        {
            tl.debug("Creating release variables with the same name as the stage variables");
            releaseVariableNamesArray = stageVariableNamesArray;
        }

        var collectionUri = tl.getVariable("System.CollectionUri");
        var teamProject = tl.getVariable("System.TeamProject");
        var releaseId = tl.getVariable("Release.ReleaseId");

        const accessToken: string = tl.getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'ACCESSTOKEN', false);
        if (!accessToken)
        {
            throw new Error(tl.loc("JS_AccessTokenNotAvailable"));
        }

        let authHandler = azdev.getHandlerFromToken(accessToken);
        let connection = new azdev.WebApi(collectionUri, authHandler);    
        let releaseApiObject: ReleaseApi.IReleaseApi  = await connection.getReleaseApi();

        tl.debug("Get release");
        try
        {
            var release: ReleaseInterfaces.Release = await releaseApiObject.getRelease(teamProject, releaseId);
        }
        catch(error)
        {
            throw new Error(tl.loc("FailedToFetchRelease", error));
        }

        var variables  = release.variables;
        for (var i=0; i < stageVariableNamesArray.length; i++)
        {
            var configurationVariableValue: ReleaseInterfaces.ConfigurationVariableValue = {};
            configurationVariableValue.value = tl.getVariable(stageVariableNamesArray[i]);
            console.log(tl.loc("JS_AssignReleaseVariable", stageVariableNamesArray[i], releaseVariableNamesArray[i]));
            variables[releaseVariableNamesArray[i]] = configurationVariableValue;
        }

        try
        {
            var updatedRelease = await releaseApiObject.updateRelease(release, teamProject, releaseId);
            console.log(tl.loc("JS_UpdatedRelease", updatedRelease.id));
        }
        catch(error)
        {
            throw new Error(tl.loc("FailedToUpdateRelease", error));
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message || 'run() failed');
    }
}

run();
