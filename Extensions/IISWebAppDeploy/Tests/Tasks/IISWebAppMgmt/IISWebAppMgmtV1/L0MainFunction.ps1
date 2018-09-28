[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\ManageIISWebApp.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should integrate all the functions and call with appropriate arguments, Should integrate all the functions and call with appropriate arguments
Register-Mock Get-Content {return "dummyscript"}
Register-Mock Invoke-RemoteDeployment { return "" } -ParametersEvaluator { $MachinesList -eq "dummyMachinesList" }
Main -machinesList "dummyMachinesList" -adminUserName "dummyadminuser" -adminPassword "dummyadminpassword" -winrmProtocol "https" -testCertificate "true" -createWebsite "true" -websiteName "dummyweb" -websitePhysicalPath "c:\inetpub\wwwroot" -websitePhysicalPathAuth "Pass through" -websiteAuthUserName "" -websiteAuthUserPassword "" -addBinding "true" -protocol "http" -ipAddress "127.0.o.1" -port "8080" -hostNameWithHttp "" -hostNameWithOutSNI "" -hostNameWithSNI "" -serverNameIndication "false" -sslCertThumbPrint "" -createAppPool "true" -appPoolName "dummy app pool" -dotNetVersion "v4.0" -pipeLineMode "Integrated" -appPoolIdentity "Specific User" -appPoolUsername "dummy user" -appPoolPassword "dummy password" -appCmdCommands "" -deployInParallel "true"
Assert-WasCalled Get-Content
Assert-WasCalled Invoke-RemoteDeployment