[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Create application pool should be called, When application pool does not exist
Register-Mock Does-AppPoolExists { return $false } -ParametersEvaluator { $AppPoolName -eq "SampleAppPool" }
Register-Mock Create-AppPool { return } -ParametersEvaluator { $AppPoolName -eq "SampleAppPool" }
Register-Mock Update-AppPool { return } -ParametersEvaluator { $AppPoolName -eq "SampleAppPool" -and $ClrVersion -eq "2.0" -and $PipeLineMode -eq "Integrated" -and $Identity -eq "SpecificUser" -and $UserName -eq "dummyUser" -and $Password -eq "DummyPassword"}
Create-And-Update-AppPool -appPoolName "SampleAppPool" -clrVersion "2.0" -pipeLineMode "Integrated" -identity "SpecificUser" -userName "dummyUser" -password "DummyPassword"
Assert-WasCalled Does-AppPoolExists
Assert-WasCalled Create-AppPool

Unregister-Mock Does-AppPoolExists
Unregister-Mock Create-AppPool
Unregister-Mock Update-AppPool

# Test 2: Create application pool should not be called, When application pool exist
Register-Mock Does-AppPoolExists { return $true } -ParametersEvaluator { $AppPoolName -eq "SampleAppPool" }
Register-Mock Create-AppPool { return } -ParametersEvaluator { $AppPoolName -eq "SampleAppPool" }
Register-Mock Update-AppPool { return } -ParametersEvaluator { $AppPoolName -eq "SampleAppPool"  -and $ClrVersion -eq "2.0" -and $PipeLineMode -eq "Integrated" -and $Identity -eq "SpecificUser" -and $UserName -eq "dummyUser" -and $Password -eq "DummyPassword"}
Create-And-Update-AppPool -appPoolName "SampleAppPool" -clrVersion "2.0" -pipeLineMode "Integrated" -identity "SpecificUser" -userName "dummyUser" -password "DummyPassword"
Assert-WasCalled Does-AppPoolExists
Assert-WasCalled -Command Create-AppPool -Times 0
