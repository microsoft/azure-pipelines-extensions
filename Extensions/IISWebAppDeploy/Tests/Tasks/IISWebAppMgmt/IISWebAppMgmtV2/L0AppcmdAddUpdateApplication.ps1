[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

$websiteName = "Sample Web Site"
$virtualPath = "/Application"
$physicalPath = "Drive:/Physical Path"
$appPoolName = ""
$physicalPathAuth = "ApplicationUserPassThrough"
$physicalPathAuthCredentials = $null

Register-Mock Test-Path { return $true } -ParametersEvaluator { $Path -eq $physicalPath }

# Test 1 : Application doesn't exist 

Register-Mock Test-ApplicationExist { return $false }
Register-Mock Run-Command { }

Add-And-Update-Application -siteName $websiteName -virtualPath $virtualPath -physicalPath $physicalPath -applicationPool $appPoolName -physicalPathAuthentication $physicalPathAuth -physicalPathAuthenticationCredentials $physicalPathAuthCredentials

Assert-WasCalled Test-ApplicationExist -Times 1
Assert-WasCalled Run-Command -Times 2
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  add app /site.name:`"Sample Web Site`" /path:`"/Application`" /physicalPath:`"Drive:/Physical Path`""
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  set app /app.name:`"Sample Web Site/Application`" -[path='/'].physicalPath:`"Drive:/Physical Path`" -[path='/'].userName: -[path='/'].password:"

# Test 2 : Application Exists. Updating properties 

$physicalPath = "Drive:/New Physical Path"
$appPoolName = "Sample App Pool"

Unregister-Mock Test-ApplicationExist
Unregister-Mock Run-Command

Register-Mock Test-ApplicationExist { return $true }
Register-Mock Run-Command { }

Add-And-Update-Application -siteName $websiteName -virtualPath $virtualPath -physicalPath $physicalPath -applicationPool $appPoolName -physicalPathAuthentication $physicalPathAuth -physicalPathAuthenticationCredentials $physicalPathAuthCredentials

Assert-WasCalled Test-ApplicationExist -Times 1
Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  set app /app.name:`"Sample Web Site/Application`" -applicationPool:`"Sample App Pool`" -[path='/'].physicalPath:`"Drive:/New Physical Path`" -[path='/'].userName: -[path='/'].password:"

# Test 3 : Updating the application's physical path authentication

$physicalPathAuth = "ApplicationWindowsAuth"
$physicalPathAuthCredentials = Get-MockCredentials

Unregister-Mock Test-ApplicationExist
Unregister-Mock Run-Command

Register-Mock Test-ApplicationExist { return $true }
Register-Mock Run-Command { }

Add-And-Update-Application -siteName $websiteName -virtualPath $virtualPath -physicalPath $physicalPath -applicationPool $appPoolName -physicalPathAuthentication $physicalPathAuth -physicalPathAuthenticationCredentials $physicalPathAuthCredentials

Assert-WasCalled Test-ApplicationExist -Times 1
Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  set app /app.name:`"Sample Web Site/Application`" -applicationPool:`"Sample App Pool`" -[path='/'].physicalPath:`"Drive:/New Physical Path`" -[path='/'].userName:`"domain\name`" -[path='/'].password:`"random!123```"`$password`""
