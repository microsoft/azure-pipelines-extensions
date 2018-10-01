[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

$websiteName = "Sample Web Site"
$virtualPath = "/Applcation/VDir"
$physicalPath = "Drive:/Physical Path"
$physicalPathAuth = "VDUserPassThrough"
$physicalPathAuthCredentials = $null

Register-Mock Test-Path { return $true } -ParametersEvaluator { $Path -eq $physicalPath }

#Test 1 : Virtual Directory doesn't exist. Create new 

Register-Mock Test-ApplicationExist { return $true }
Register-Mock Test-VirtualDirectoryExist { return $false }
Register-Mock Run-Command { }

Add-And-Update-VirtualDirectory -siteName $websiteName -virtualPath $virtualPath -physicalPath $physicalPath -physicalPathAuthentication $physicalPathAuth -physicalPathAuthenticationCredentials $physicalPathAuthCredentials

Assert-WasCalled Test-ApplicationExist -Times 1
Assert-WasCalled Test-VirtualDirectoryExist -Times 1
Assert-WasCalled Run-Command -Times 2
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  add vdir /app.name:`"Sample Web Site/Applcation`" /path:`"/VDir`" /physicalPath:`"Drive:/Physical Path`""
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  set vdir /vdir.name:`"Sample Web Site/Applcation/VDir`" -physicalPath:`"Drive:/Physical Path`" -userName: -password:"

# Test 2 : Virtual Directory exists. Updating 

$physicalPathAuth = "VDWindowsAuth"
$physicalPathAuthCredentials = Get-MockCredentials

UnRegister-Mock Test-ApplicationExist
Unregister-Mock Test-VirtualDirectoryExist
Unregister-Mock Run-Command

Register-Mock Test-ApplicationExist { return $true }
Register-Mock Test-VirtualDirectoryExist { return $true }
Register-Mock Run-Command { }

Add-And-Update-VirtualDirectory -siteName $websiteName -virtualPath $virtualPath -physicalPath $physicalPath -physicalPathAuthentication $physicalPathAuth -physicalPathAuthenticationCredentials $physicalPathAuthCredentials

Assert-WasCalled Test-ApplicationExist -Times 1
Assert-WasCalled Test-VirtualDirectoryExist -Times 1
Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  set vdir /vdir.name:`"Sample Web Site/Applcation/VDir`" -physicalPath:`"Drive:/Physical Path`" -userName:`"domain\name`" -password:`"random!123```"`$password`""

# Test 3 : Physical root folder, not application

$physicalPathAuth = "VDUserPassThrough"
$physicalPathAuthCredentials = $null

UnRegister-Mock Test-ApplicationExist
Unregister-Mock Test-VirtualDirectoryExist
Unregister-Mock Run-Command

Register-Mock Test-ApplicationExist { return $false } # Application doesn't exist.  Treat it as a root, physical folder.
Register-Mock Test-VirtualDirectoryExist { return $false }
Register-Mock Run-Command { }

Add-And-Update-VirtualDirectory -siteName $websiteName -virtualPath $virtualPath -physicalPath $physicalPath -physicalPathAuthentication $physicalPathAuth -physicalPathAuthenticationCredentials $physicalPathAuthCredentials

Assert-WasCalled Test-ApplicationExist -Times 1
Assert-WasCalled Test-VirtualDirectoryExist -Times 1
Assert-WasCalled Run-Command -Times 2
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  add vdir /app.name:`"Sample Web Site/`" /path:`"/Applcation/VDir`" /physicalPath:`"Drive:/Physical Path`""
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  set vdir /vdir.name:`"Sample Web Site/Applcation/VDir`" -physicalPath:`"Drive:/Physical Path`" -userName: -password:"

# Test 4 : VDir starting with letters that occur within the app name

$virtualPath = "/MyApp/MyVDir"

UnRegister-Mock Test-ApplicationExist
Unregister-Mock Test-VirtualDirectoryExist
Unregister-Mock Run-Command

Register-Mock Test-ApplicationExist { return $true }
Register-Mock Test-VirtualDirectoryExist { return $false }
Register-Mock Run-Command { }

Add-And-Update-VirtualDirectory -siteName $websiteName -virtualPath $virtualPath -physicalPath $physicalPath -physicalPathAuthentication $physicalPathAuth -physicalPathAuthenticationCredentials $physicalPathAuthCredentials

Assert-WasCalled Test-ApplicationExist -Times 1
Assert-WasCalled Test-VirtualDirectoryExist -Times 1
Assert-WasCalled Run-Command -Times 2
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  add vdir /app.name:`"Sample Web Site/MyApp`" /path:`"/MyVDir`" /physicalPath:`"Drive:/Physical Path`""
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  set vdir /vdir.name:`"Sample Web Site/MyApp/MyVDir`" -physicalPath:`"Drive:/Physical Path`" -userName: -password:"
