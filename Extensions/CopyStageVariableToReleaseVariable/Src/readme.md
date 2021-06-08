
# Description

This extension will allow you to easily assign the value of Stage Variables to a new Release Variable. 

Please note, any existing release variables of the same name as the release variable that will be created will be overwritten.

## **Usage**

The extension installs the following tasks:

**Copy agent job variable to release variable**: Assigns the value of a agent stage variable to a new release variable. Task inputs are as follows:

- **Stage variable names**: Enter the stage variable name whose value you want to assign to the release variable. Use commas to separate multiple stage variables.
- **Release variables names**: Enter the release variable name you want create. Use commas to separate multiple release variable names for multiple stage variables names. If empty, release variables will be created with the same name as the stage variables

**Copy agentless job variable to Release variable**: Assigns the value of a agentless stage variable to a new release variable. Task inputs are as follows:

- **Stage variable name**: Enter the stage variable name whose value you want to assign to a release variable.
- **Release variables name**: Enter the release variable name you want create.
- **Set as a secret release variable**: Check if you want the release variable to be a secret