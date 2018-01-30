[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Extensions\Common\lib\Initialize-Test.ps1
. $PSScriptRoot\MockHelpers.ps1

. $PSScriptRoot\..\..\TaskModuleIISManageUtility\AppCmdOnTargetMachines.ps1

$websiteName = "Sample Web Site"
$virtualPath = "/Applcation/VDir"
$physicalPath = "Drive:/Physical Path"
$physicalPathAuth = "VDUserPassThrough"
$physicalPathAuthCredentials = $null

Register-Mock Test-Path { return $true } -ParametersEvaluator { $Path -eq $physicalPath }

#Test 1 : Virtual Directory doesn't exist. Create new 

Register-Mock Test-ApplicationExist { return $true }
Register-Mock Test-VirtualDirectoryExist { return $false }
Register-Mock Invoke-VstsTool { }

Add-And-Update-VirtualDirectory -siteName $websiteName -virtualPath $virtualPath -physicalPath $physicalPath -physicalPathAuthentication $physicalPathAuth -physicalPathAuthenticationCredentials $physicalPathAuthCredentials

Assert-WasCalled Test-ApplicationExist -Times 1
Assert-WasCalled Test-VirtualDirectoryExist -Times 1
Assert-WasCalled Invoke-VstsTool -Times 2
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " add vdir /app.name:`"Sample Web Site/Applcation`" /path:`"/VDir`" /physicalPath:`"Drive:/Physical Path`"" -RequireExitCodeZero
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " set vdir /vdir.name:`"Sample Web Site/Applcation/VDir`" -physicalPath:`"Drive:/Physical Path`" -userName: -password:" -RequireExitCodeZero

# Test 2 : Virtual Directory exists. Updating 

$physicalPathAuth = "VDWindowsAuth"
$physicalPathAuthCredentials = Get-MockCredentials

UnRegister-Mock Test-ApplicationExist
Unregister-Mock Test-VirtualDirectoryExist
Unregister-Mock Invoke-VstsTool

Register-Mock Test-ApplicationExist { return $true }
Register-Mock Test-VirtualDirectoryExist { return $true }
Register-Mock Invoke-VstsTool { }

Add-And-Update-VirtualDirectory -siteName $websiteName -virtualPath $virtualPath -physicalPath $physicalPath -physicalPathAuthentication $physicalPathAuth -physicalPathAuthenticationCredentials $physicalPathAuthCredentials

Assert-WasCalled Test-ApplicationExist -Times 1
Assert-WasCalled Test-VirtualDirectoryExist -Times 1
Assert-WasCalled Invoke-VstsTool -Times 1
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " set vdir /vdir.name:`"Sample Web Site/Applcation/VDir`" -physicalPath:`"Drive:/Physical Path`" -userName:`"domain\name`" -password:`"random!123```"`$password`"" -RequireExitCodeZero

# Test 3 : Physical root folder, not application

$physicalPathAuth = "VDUserPassThrough"
$physicalPathAuthCredentials = $null

UnRegister-Mock Test-ApplicationExist
Unregister-Mock Test-VirtualDirectoryExist
Unregister-Mock Invoke-VstsTool

Register-Mock Test-ApplicationExist { return $false } # Application doesn't exist.  Treat it as a root, physical folder.
Register-Mock Test-VirtualDirectoryExist { return $false }
Register-Mock Invoke-VstsTool { }

Add-And-Update-VirtualDirectory -siteName $websiteName -virtualPath $virtualPath -physicalPath $physicalPath -physicalPathAuthentication $physicalPathAuth -physicalPathAuthenticationCredentials $physicalPathAuthCredentials

Assert-WasCalled Test-ApplicationExist -Times 1
Assert-WasCalled Test-VirtualDirectoryExist -Times 1
Assert-WasCalled Invoke-VstsTool -Times 2
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " add vdir /app.name:`"Sample Web Site/`" /path:`"/Applcation/VDir`" /physicalPath:`"Drive:/Physical Path`"" -RequireExitCodeZero
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " set vdir /vdir.name:`"Sample Web Site/Applcation/VDir`" -physicalPath:`"Drive:/Physical Path`" -userName: -password:" -RequireExitCodeZero

# Test 4 : VDir starting with letters that occur within the app name

$virtualPath = "/MyApp/MyVDir"

UnRegister-Mock Test-ApplicationExist
Unregister-Mock Test-VirtualDirectoryExist
Unregister-Mock Invoke-VstsTool

Register-Mock Test-ApplicationExist { return $true }
Register-Mock Test-VirtualDirectoryExist { return $false }
Register-Mock Invoke-VstsTool { }

Add-And-Update-VirtualDirectory -siteName $websiteName -virtualPath $virtualPath -physicalPath $physicalPath -physicalPathAuthentication $physicalPathAuth -physicalPathAuthenticationCredentials $physicalPathAuthCredentials

Assert-WasCalled Test-ApplicationExist -Times 1
Assert-WasCalled Test-VirtualDirectoryExist -Times 1
Assert-WasCalled Invoke-VstsTool -Times 2
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " add vdir /app.name:`"Sample Web Site/MyApp`" /path:`"/MyVDir`" /physicalPath:`"Drive:/Physical Path`"" -RequireExitCodeZero
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " set vdir /vdir.name:`"Sample Web Site/MyApp/MyVDir`" -physicalPath:`"Drive:/Physical Path`" -userName: -password:" -RequireExitCodeZero
