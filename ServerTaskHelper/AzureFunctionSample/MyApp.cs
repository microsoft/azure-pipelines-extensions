using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using Microsoft.Azure.Management.ContainerInstance.Fluent;
using Microsoft.Azure.Management.Fluent;
using Microsoft.Azure.Management.ResourceManager.Fluent;

namespace AzureFunctionSample
{
    internal class MyApp
    {
        public static async Task CreateContainer(TaskLogger taskLogger, MyAppParameters myAppParameters)
        {
            // Get credentials
            var credentials = SdkContext.AzureCredentialsFactory
                         .FromServicePrincipal(myAppParameters.AzureSubscriptionClientId,
                             myAppParameters.AzureSubscriptionClientSecret,
                             myAppParameters.TenantId,
                             AzureEnvironment.AzureGlobalCloud);

            // Authenticate with Azure
            var azure = Azure.Configure()
                                .Authenticate(credentials)
                                .WithDefaultSubscription();

            var message = $"Authenticated with azure";
            await taskLogger.Log(message).ConfigureAwait(false);

            message = $"Getting resource group '{myAppParameters.ResourceGroupName}' details.";
            await taskLogger.Log(message).ConfigureAwait(false);

            // Check resource group exist or not.
            IResourceGroup resourceGroup = azure.ResourceGroups.GetByName(myAppParameters.ResourceGroupName);
            if (resourceGroup == null)
            {
                message = $"Resource group '{myAppParameters.ResourceGroupName}' not found.";
                throw new Exception(message);
            }

            // Check container group exist or not.
            IContainerGroup containerGroup = azure.ContainerGroups.GetByResourceGroup(myAppParameters.ResourceGroupName, myAppParameters.AgentName);
            if (containerGroup != null)
            {
                message = $"Already container group with name '{myAppParameters.AgentName}' exist in resource group '{myAppParameters.ResourceGroupName}'.";
                throw new Exception(message);
            }

            message = $"Creating container group '{myAppParameters.AgentName}' in resource group '{myAppParameters.ResourceGroupName}' with container image 'microsoft/vsts-agent:latest' ...";
            await taskLogger.Log(message).ConfigureAwait(false);

            message = $"This will take more than 15 mins... You can check container creating logs in Azure portal.";
            await taskLogger.Log(message).ConfigureAwait(false);

            var azureRegion = resourceGroup.Region;
            var env = new Dictionary<string, string>
                {
                    { "VSTS_ACCOUNT", myAppParameters.PipelineAccountName },
                    { "VSTS_TOKEN",  myAppParameters.PATToken },  // This PAT token used to configure the agent. This PAT token should have permission to configure the agent else container moves to running state without configuring the agent 
                    { "VSTS_AGENT", myAppParameters.AgentName },
                    { "VSTS_POOL", myAppParameters.AgentPoolName }
                };

            // Create container group with image.
            await CreateContainerWithAsync(taskLogger, azure, resourceGroup.RegionName, myAppParameters, env);
            // You can use below function to CreateContainerGroup With Polling
            // await CreateContainerGroupWithPolling(taskLogger, azure, resourceGroup.RegionName, myAppParameters, env);

            message = $"Azure pipeline agent container running..";
            await taskLogger.Log(message).ConfigureAwait(false);
        }

        private static async Task CreateContainerWithAsync(TaskLogger taskLogger, IAzure azure, string azureRegion, MyAppParameters myAppParameters, Dictionary<string, string> envVariables)
        {
            var containerGroup = await azure.ContainerGroups.Define(myAppParameters.AgentName)
                                    .WithRegion(azureRegion)
                                    .WithExistingResourceGroup(myAppParameters.ResourceGroupName)
                                    .WithLinux()
                                    .WithPublicImageRegistryOnly()
                                    .WithoutVolume()
                                    .DefineContainerInstance(myAppParameters.AgentName)
                                        .WithImage("microsoft/vsts-agent")
                                        .WithoutPorts()
                                        .WithEnvironmentVariables(envVariables)
                                        .Attach()
                                    .CreateAsync();

            if (containerGroup.Refresh().State != "Running")
            {
                var errMessage = $"Container group: {myAppParameters.AgentName} not moved to Running state. Please check container status in Azure portal.";
                throw new Exception(errMessage);
            }

            var message = $"Container group: {myAppParameters.AgentName} in resource group '{myAppParameters.ResourceGroupName}' created with image 'microsoft/vsts-agent'. Container group state: {containerGroup.Refresh().State}";
            await taskLogger.Log(message).ConfigureAwait(false);
        }

        private static async Task CreateContainerGroupWithPolling(TaskLogger taskLogger, IAzure azure, string azureRegion, MyAppParameters myAppParameters, Dictionary<string, string> envVariables)
        {
            string message;
            // Create the container group using a fire-and-forget task
            Task.Run(() =>
                        azure.ContainerGroups.Define(myAppParameters.AgentName)
                                    .WithRegion(azureRegion)
                                    .WithExistingResourceGroup(myAppParameters.ResourceGroupName)
                                    .WithLinux()
                                    .WithPublicImageRegistryOnly()
                                    .WithoutVolume()
                                    .DefineContainerInstance(myAppParameters.AgentName)
                                        .WithImage("microsoft/vsts-agent")
                                        .WithoutPorts()
                                        .WithEnvironmentVariables(envVariables)
                                        .Attach()
                                    .CreateAsync()
            );

            // Poll for the container group
            IContainerGroup containerGroup = null;
            while (containerGroup == null)
            {
                containerGroup = azure.ContainerGroups.GetByResourceGroup(myAppParameters.ResourceGroupName, myAppParameters.AgentName);
                await taskLogger.Log(".").ConfigureAwait(false);
                SdkContext.DelayProvider.Delay(1000);
            }

            Console.WriteLine();

            var i = 18000; // wait for 5 hrs
            // Poll until the container group is running
            while (containerGroup.State != "Running" && i > 0)
            {
                message = $"Container group state: {containerGroup.Refresh().State}";
                await taskLogger.Log(message).ConfigureAwait(false);
                Thread.Sleep(1000);
                i--;
            }

            if (containerGroup.State != "Running")
            {
                var errorMessage = $"Container group: {myAppParameters.AgentName} not moved to Running state even after 5hrs. Please check container status in Azure portal.";
                throw new Exception(errorMessage);
            }

            message = $"Container group: {myAppParameters.AgentName} in resource group '{myAppParameters.ResourceGroupName}' created with image 'microsoft/vsts-agent'. Container group state: {containerGroup.Refresh().State}";
            await taskLogger.Log(message).ConfigureAwait(false);
        }
    }
}
