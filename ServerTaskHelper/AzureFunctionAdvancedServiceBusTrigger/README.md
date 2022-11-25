### In advanced example, Azure Function checks that the Azure Boards ticket referenced by the commit that triggered the pipeline run is completed.
### This azure function is dependant on AzureFunctionAdvancedHandler azure function and cannot work without it.
### In order for this example to work, instructions mentioned in the README.md file within AzureFunctionAdvancedHandler project should be followed.

### The Azure Function goes through the following steps:
1. Consumes the message, automatically done when the azure function is invoked
2. Does not continue scheduling other checks if build is not running anymore
3. Retrieves Azure Boards ticket referenced in the commit that triggered the pipeline run
4. Checks if the ticket is in the `Completed` state
5. Sends a status update with the result of the check
6. If the ticket isn't in the Completed state, it reschedules another evaluation in 1 minute
7. Once the ticket is in the correct state, it sends a positive decision to Azure Pipelines
