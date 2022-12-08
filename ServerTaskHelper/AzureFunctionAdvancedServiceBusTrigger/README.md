# Advanced Invoke Azure Function Check Dependency Example

This advanced example shows how to trigger an Azure Function that checks if an [Azure Boards](https://azure.microsoft.com/products/devops/boards/) work item is in a **Completed** state.

For more information about the workflow and configuration of this Azure Function, refer to the [README.md file of AzureFunctionAdvancedHandler project](../AzureFunctionAdvancedHandler/README.md).

# Steps

The Azure Function goes through the following steps:

1. Runs when there is a new a message in the `az-advanced-checks-queue` ServiceBus queue 
2. Checks if the build is completed, and stops if there is the the build stops.
3. Retrieves the Azure Boards work item referenced in the build's commit
4. Checks if the work item is in the `Completed` state
5. Sends a status update with the result of the check
6. If the work item isn't in the `Completed` state, the function reschedules another evaluation in `{ChecksEvaluationPeriodInMinutes}` minutes (by default, 1 minute)
7. Once the work item is in the correct state, the function sends a positive decision to Azure Pipelines
