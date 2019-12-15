VSS.ready(() => {
    console.log('VSS ready');
    //console.log(VSS.getConfiguration());
    showUI();
});

VSS.register('registeredEnvironmentObject', {
    pageTitle: (state) => {
        console.log(`Page title ${state}`);
        return 'Hello tab';
    },
    updateContext: (tabContext) => {
        console.log(`Updating ${JSON.stringify(tabContext)}`);
    },
    isInvisible: (state) => {
        return false;
    },
    isDisabled: (state) => {
        return false;
    }
});

function showUI() {
    VSS.require(['ReleaseManagement/Core/RestClient'], (rmo_core_restclient) => {
        let webContext = VSS.getWebContext();
        let projectId = webContext.project.id;

        console.log(`Project id ${projectId}`);
        
        let releaseEnvironment = VSS.getConfiguration().releaseEnvironment;
        console.log(releaseEnvironment);
        
        let releaseId = releaseEnvironment.releaseId;
        console.log(`Release id ${releaseId}`);

        let releaseClient = rmo_core_restclient.getClient();
        console.log(releaseClient);

        releaseClient.getRelease(projectId, releaseId, null, null, 32).then((release) => {
            console.log('Success');
            console.log(release);
        }, (error) => {
            console.log('Error');
            console.log(error);
        })
    });
}