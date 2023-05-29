[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\SqlDacpacDeploy\SqlDacpacDeployV2\DeployToSqlServer.ps1

# Arrange

$invalidAdditionalArgumentsWithSemicolon = "echo 123 ; start notepad.exe"
$invalidAdditionalArgumentsWithAmpersand = "echo 123 & start notepad.exe"
$invalidAdditionalArgumentsWithVerticalBar = "echo 123 | start notepad.exe"
$validAdditionalArgumentsWithArrayOfParameters = '/p:CreateNewDatabase=false /p:DoNotDropObjectTypes="RoleMembership;ServerRoleMembership;Permissions;Users;Filegroups;ApplicationRoles;DatabaseRoles;ServerRoles;LinkedServers;Assemblies"'
$invalidAdditionalArgumentsWithArrayOfParameters = '/p:CreateNewDatabase=false ; start notepad.exe /p:DoNotDropObjectTypes="RoleMembership;ServerRoleMembership;Permissions;Users;Filegroups;ApplicationRoles;DatabaseRoles;ServerRoles;LinkedServers;Assemblies"'

$additionalArgumentsValidationErrorMessage = "Additional arguments can't include separator characters '&', ';' and '|'. Please verify input. To learn more about argument validation, please check https://aka.ms/azdo-task-argument-validation"

# Assert

Assert-Throws {
   Validate-AdditionalArguments $invalidAdditionalArgumentsWithSemicolon
} -Message $additionalArgumentsValidationErrorMessage
 
Assert-Throws {
   Validate-AdditionalArguments $invalidAdditionalArgumentsWithAmpersand
} -Message $additionalArgumentsValidationErrorMessage

Assert-Throws {
   Validate-AdditionalArguments $invalidAdditionalArgumentsWithVerticalBar
} -Message $additionalArgumentsValidationErrorMessage

Assert-Throws {
   Validate-AdditionalArguments $invalidAdditionalArgumentsWithArrayOfParameters
} -Message $additionalArgumentsValidationErrorMessage

Validate-AdditionalArguments $validAdditionalArgumentsWithArrayOfParameters