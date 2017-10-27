[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Extensions\Common\lib\Initialize-Test.ps1
. $PSScriptRoot\MockHelpers.ps1

. $PSScriptRoot\..\..\TaskModuleIISManageUtility\AppCmdOnTargetMachines.ps1

$siteName = "Sample Web Site"
$appPoolName = ""
$physicalPath = "Drive:/RandomPath"
$authType = "WebsiteUserPassThrough"
$websitePhysicalPathAuthCredentials = $null

# Test 1 : Website already exists 

Register-Mock Test-WebsiteExist { return $true }
Register-Mock Test-Path { return $true } 
Register-Mock Invoke-VstsTool { } 

Add-And-Update-Website -siteName $siteName -appPoolName $appPoolName -physicalPath $physicalPath -authType $authType `
                -websitePhysicalPathAuthCredentials $websitePhysicalPathAuthCredentials 

Assert-WasCalled Test-WebsiteExist -Times 1
Assert-WasCalled Invoke-VstsTool -Times 1

# Test 2 : Website does not exist 

Unregister-Mock Test-WebsiteExist
Unregister-Mock Invoke-VstsTool

Register-Mock Test-WebsiteExist { return $false }
Register-Mock Invoke-VstsTool { }

Add-And-Update-Website -siteName $siteName -appPoolName $appPoolName -physicalPath $physicalPath -authType $authType `
                -websitePhysicalPathAuthCredentials $websitePhysicalPathAuthCredentials 

Assert-WasCalled Test-WebsiteExist -Times 1
Assert-WasCalled Invoke-VstsTool -Times 2
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " add site /name:`"Sample Web Site`" /physicalPath:`"Drive:/RandomPath`""  -RequireExitCodeZero
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " set site /site.name:`"Sample Web Site`" -[path='/'].[path='/'].physicalPath:`"Drive:/RandomPath`" -[path='/'].[path='/'].userName: -[path='/'].[path='/'].password:" -RequireExitCodeZero

# Test 3 : Website exists and update app pool is enabled

$appPoolName = "Sample App Pool"

Unregister-Mock Test-WebsiteExist
Unregister-Mock Invoke-VstsTool

Register-Mock Test-WebsiteExist { return $true }
Register-Mock Invoke-VstsTool { }

Add-And-Update-Website -siteName $siteName -appPoolName $appPoolName -physicalPath $physicalPath -authType $authType `
                -websitePhysicalPathAuthCredentials $websitePhysicalPathAuthCredentials

Assert-WasCalled Test-WebsiteExist -Times 1
Assert-WasCalled Invoke-VstsTool -Times 1
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " set site /site.name:`"Sample Web Site`" -applicationDefaults.applicationPool:`"Sample App Pool`" -[path='/'].[path='/'].physicalPath:`"Drive:/RandomPath`" -[path='/'].[path='/'].userName: -[path='/'].[path='/'].password:" -RequireExitCodeZero

# Test 4 : Physical path authentication input is enabled

$appPoolName = ""
$authType = "WebsiteWindowsAuth"
$websitePhysicalPathAuthCredentials = Get-MockCredentials

Unregister-Mock Test-WebsiteExist
Unregister-Mock Invoke-VstsTool

Register-Mock Test-WebsiteExist { return $true }
Register-Mock Invoke-VstsTool { }

Add-And-Update-Website -siteName $siteName -appPoolName $appPoolName -physicalPath $physicalPath -authType $authType `
                -websitePhysicalPathAuthCredentials $websitePhysicalPathAuthCredentials -addBinding $addBinding -protocol $protocol `
                -ipAddress $ipAddress -port $port -hostname $hostname        

Assert-WasCalled Test-WebsiteExist -Times 1
Assert-WasCalled Invoke-VstsTool -Times 1
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " set site /site.name:`"Sample Web Site`" -[path='/'].[path='/'].physicalPath:`"Drive:/RandomPath`" -[path='/'].[path='/'].userName:`"domain\name`" -[path='/'].[path='/'].password:`"random!123```"`$password`"" -RequireExitCodeZero
