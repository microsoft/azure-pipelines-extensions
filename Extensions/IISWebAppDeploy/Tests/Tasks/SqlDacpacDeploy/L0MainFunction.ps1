[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\SqlDacpacDeploy\DeployToSqlServer.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\Utility.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

Register-Mock Get-Content {return "dummyscript"}        
Register-Mock Invoke-RemoteDeployment { return "" } -ParametersEvaluator { $MachinesList -eq "dummyMachinesList" }
Register-Mock TrimInputs { return }

# Test 1: Should integrate all the functions and call with appropriate arguments when task type is dacpac
Main -machinesList "dummyMachinesList" -adminUserName "dummyadminuser" -adminPassword "dummyadminpassword" -winrmProtocol "https" -testCertificate "true" -dacpacFile "sample.dacpac" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -sqlUserName "sampleuser" -sqlPassword "dummypassword" -connectionString "" -publishProfile "" -additionalArguments "" -taskType "dacpac" -inlineSql "" -sqlFile ""

Assert-WasCalled -command Get-Content -Times 2
Assert-WasCalled -command Invoke-RemoteDeployment -Times 1
Assert-WasCalled -command TrimInputs -Times 1

# Test 2: Should integrate all the functions and call with appropriate arguments when task type is sqlQuery
Main -machinesList "dummyMachinesList" -adminUserName "dummyadminuser" -adminPassword "dummyadminpassword" -winrmProtocol "http" -dacpacFile "" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme sqlServerAuthentication -sqlUserName "sampleuser" -sqlPassword "dummypassword" -connectionString "" -publishProfile "" -additionalArguments "" -taskType "sqlQuery" -inlineSql "" -sqlFile "sample.sql"

Assert-WasCalled -command Get-Content -Times 4
Assert-WasCalled -command Invoke-RemoteDeployment -Times 2
Assert-WasCalled -command TrimInputs -Times 2
