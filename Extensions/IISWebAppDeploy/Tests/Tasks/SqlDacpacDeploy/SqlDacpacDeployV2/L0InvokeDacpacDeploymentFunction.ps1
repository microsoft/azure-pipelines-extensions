[CmdletBinding()]
param()

. $PSScriptRoot\SqlDacpacDeployTestL0Initialize.ps1

# Test 1: Should deploy dacpac file, When execute DacpacDeployment is invoked with all inputs
Register-Mock Get-SqlPackageOnTargetMachine { return "sqlpackage.exe" }
Register-Mock Get-SqlPackageCmdArgs { return "args" } -ParametersEvaluator { $DacpacFile -eq "sample.dacpac" }
Register-Mock ExecuteCommand { return }
Invoke-DacpacDeployment -dacpacFile "sample.dacpac" -targetMethod "server" -serverName "localhost"

Assert-WasCalled Get-SqlPackageCmdArgs
Assert-WasCalled ExecuteCommand
Assert-WasCalled -Command Get-SqlPackageOnTargetMachine -Times 1

