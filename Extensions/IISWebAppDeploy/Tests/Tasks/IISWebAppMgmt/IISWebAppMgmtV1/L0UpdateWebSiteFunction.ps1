[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should contain appropriate options in command line, when all the inputs are given
$appCmd = "appcmd.exe"
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation { return $appCmd, 8 }
Register-Mock Does-BindingExists { return $false } -ParametersEvaluator { $SiteName -eq "Sample Web" }
$output = Update-WebSite -siteName "Sample Web" -appPoolName "App Pool" -physicalPath "C:\Temp Path" -authType "WebSiteWindowsAuth" -userName "localuser" -password "SomePassword" -addBinding "true" -protocol "http" -ipAddress "All Unassigned" -port "80" -hostname "localhost"  4>&1 | Out-String
Assert-AreEqual $true ($output.Contains("-applicationDefaults.applicationPool"))
Assert-AreEqual $true ($output.Contains("-[path='/'].[path='/'].physicalPath:"))
Assert-AreEqual $true ($output.Contains("-[path='/'].[path='/'].userName:localuser"))
Assert-AreEqual $true ($output.Contains("-[path='/'].[path='/'].password:SomePassword"))
Assert-AreEqual $true ($output.Contains("/+bindings.[protocol='http',bindingInformation='*:80:localhost']"))
Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation
Assert-WasCalled Does-BindingExists

Unregister-Mock Run-Command
Unregister-Mock Get-AppCmdLocation
Unregister-Mock Does-BindingExists

# Test 2: Should contain appropriate options in command line, when all the inputs are given except website auth password
$appCmd = "appcmd.exe"
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation { return $appCmd, 8 }
Register-Mock Does-BindingExists { return $false } -ParametersEvaluator { $SiteName -eq "Sample Web" }
$output = Update-WebSite -siteName "Sample Web" -appPoolName "App Pool" -physicalPath "C:\Temp Path" -authType "WebSiteWindowsAuth" -userName "localuser" -addBinding "true" -protocol "http" -ipAddress "All Unassigned" -port "80" -hostname "localhost"  4>&1 | Out-String
Assert-AreEqual $true ($output.Contains("-applicationDefaults.applicationPool"))
Assert-AreEqual $true ($output.Contains("-[path='/'].[path='/'].physicalPath:"))
Assert-AreEqual $true ($output.Contains("-[path='/'].[path='/'].userName:localuser"))
Assert-AreEqual $false ($output.Contains("-[path='/'].[path='/'].password:"))
Assert-AreEqual $true ($output.Contains("/+bindings.[protocol='http',bindingInformation='*:80:localhost']"))
Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation
Assert-WasCalled Does-BindingExists

Unregister-Mock Run-Command
Unregister-Mock Get-AppCmdLocation
Unregister-Mock Does-BindingExists

# Test 3: Should contain appropriate options in command line, When authType is passthrough, AppPool is not given and binding already existing
$appCmd = "appcmd.exe"
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation { return $appCmd, 8 }
Register-Mock Does-BindingExists { return $true } -ParametersEvaluator { $SiteName -eq "SampleWeb" }
$output = Update-WebSite -siteName "SampleWeb" -physicalPath "C:\Temp" -authType "PassThrough" -addBinding "true" -protocol "http" -ipAddress "`"All Unassigned`"" -port "80" -hostname "localhost" 4>&1 | Out-String
Assert-AreEqual $false ($output.Contains("-applicationDefaults.applicationPool"))
Assert-AreEqual $true ($output.Contains("-[path='/'].[path='/'].physicalPath:"))
Assert-AreEqual $false ($output.Contains("-[path='/'].[path='/'].userName:"))
Assert-AreEqual $false ($output.Contains("-[path='/'].[path='/'].password:"))
Assert-AreEqual $false ($output.Contains("/+bindings"))
Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation
Assert-WasCalled Does-BindingExists

Unregister-Mock Run-Command
Unregister-Mock Get-AppCmdLocation
Unregister-Mock Does-BindingExists

# Test 4: Should contain appropriate options in command line, When authType is passthrough, AppPool is not given and add binding is false
$appCmd = "appcmd.exe"
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation { return $appCmd, 8 }
Register-Mock Does-BindingExists { return $false } -ParametersEvaluator { $SiteName -eq "SampleWeb" }
$output = Update-WebSite -siteName "SampleWeb" -physicalPath "C:\Temp" -authType "PassThrough" -addBinding "false" -protocol "http" -ipAddress "`"All Unassigned`"" -port "80" -hostname "localhost" 4>&1 | Out-String
Assert-AreEqual $false ($output.Contains("-applicationDefaults.applicationPool"))
Assert-AreEqual $true ($output.Contains("-[path='/'].[path='/'].physicalPath:"))
Assert-AreEqual $false ($output.Contains("-[path='/'].[path='/'].userName:"))
Assert-AreEqual $false ($output.Contains("-[path='/'].[path='/'].password:"))
Assert-AreEqual $false ($output.Contains("/+bindings"))
Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation
Assert-WasCalled -Command Does-BindingExists -Times 0 -ParametersEvaluator { $SiteName -eq "SampleWeb" }

Unregister-Mock Run-Command
Unregister-Mock Get-AppCmdLocation
Unregister-Mock Does-BindingExists

# Test 5: Should create physicalPath of the website, When physicalPath of the website does not exist
$appCmd = "appcmd.exe"
$physicalPath = "$env:SystemDrive:\IISPhysicalPath"
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation { return $appCmd, 8 }
Register-Mock Does-BindingExists { return $false } -ParametersEvaluator { $SiteName -eq "SampleWeb" }
$output = Update-WebSite -siteName "SampleWeb" -physicalPath $physicalPath -authType "PassThrough" -addBinding "false" -protocol "http" -ipAddress "`"All Unassigned`"" -port "80" -hostname "localhost" 4>&1 | Out-String   
Assert-AreEqual $true (Test-Path -Path $physicalPath)
Remove-Item -Path $physicalPath -Force -Recurse
