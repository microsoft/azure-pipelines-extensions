[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppDeploy\IISWebAppDeployV2\MsDeployOnTargetMachines.ps1

# Arrange

$invalidAdditionalArgumentsWithSemicolon = "echo 123 ; start notepad.exe"
$invalidAdditionalArgumentsWithAmpersand = "echo 123 & start notepad.exe"
$invalidAdditionalArgumentsWithVerticalBar = "echo 123 | start notepad.exe"
$validAdditionalArgumentsWithArrayOfParameters = '/p:CreateNewDatabase=false /p:DoNotDropObjectTypes="RoleMembership;ServerRoleMembership"'
$invalidAdditionalArgumentsWithArrayOfParameters = '/p:CreateNewDatabase=false ; start notepad.exe /p:DoNotDropObjectTypes="RoleMembership;ServerRoleMembership"'

$additionalArgumentsValidationErrorMessage = "Additional arguments can't include separator characters '&', ';' and '|'. Please verify input. To learn more about argument validation, please check https://aka.ms/azdo-task-argument-validation"

# Assert

Assert-Throws {
  Get-ValidatedAdditionalArguments -msDeployCmdArgs "" -additionalArguments $invalidAdditionalArgumentsWithSemicolon
 } -Message $additionalArgumentsValidationErrorMessage
 
Assert-Throws {
  Get-ValidatedAdditionalArguments -msDeployCmdArgs "" -additionalArguments $invalidAdditionalArgumentsWithAmpersand
} -Message $additionalArgumentsValidationErrorMessage

Assert-Throws {
  Get-ValidatedAdditionalArguments -msDeployCmdArgs "" -additionalArguments $invalidAdditionalArgumentsWithVerticalBar
} -Message $additionalArgumentsValidationErrorMessage

Assert-Throws {
  Get-ValidatedAdditionalArguments -msDeployCmdArgs "" -additionalArguments $invalidAdditionalArgumentsWithArrayOfParameters
} -Message $additionalArgumentsValidationErrorMessage

Get-ValidatedAdditionalArguments -msDeployCmdArgs "" -additionalArguments $validAdditionalArgumentsWithArrayOfParameters