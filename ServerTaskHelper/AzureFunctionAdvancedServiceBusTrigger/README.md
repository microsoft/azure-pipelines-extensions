# Advanced Invoke Azure Function Check Dependency Example

This advanced example shows an Azure Function that checks that an [Azure Boards](https://azure.microsoft.com/products/devops/boards/) work item referenced by the commit that triggered a pipeline run is completed.

For more information about the workflow and configuration of this Azure Function, refer to the [README.md file of AzureFunctionAdvancedHandler project](../AzureFunctionAdvancedHandler/README.md).

# Steps

The Azure Function goes through the following steps:

1. Runs when there is a new a message in the `az-advanced-checks-queue` ServiceBus queue 
2. Checks if the build is completed, and terminates the logic in case it is
3. Retrieves the Azure Boards ticket referenced in the build's commit
4. Checks if the ticket is in the `Completed` state
5. Sends a status update with the result of the check
6. If the ticket isn't in the `Completed` state, it reschedules another evaluation in `{ChecksEvaluationPeriodInMinutes}` minutes (by default, 1 minute)
7. Once the ticket is in the correct state, it sends a positive decision to Azure Pipelines
