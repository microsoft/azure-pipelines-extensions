[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$appCmdNotFoundError = "Cannot find appcmd.exe location. Verify IIS is configured on $env:ComputerName and try operation again."
$appCmdMinVersionError = "Version of IIS is less than 7.0 on machine $env:ComputerName. Minimum version of IIS required is 7.0"

# Test 1: Should throw task not supported exception, Get-ItemProperty for MajorVersion returns version 6
$regKeyWithNoInstallPath = "HKLM:\SOFTWARE\Microsoft"
$regKey = @{ MajorVersion = "6" 
            InstallPath = "$env:SystemDrive"}

Register-Mock Get-ItemProperty { return $regKey } -ParametersEvaluator { $Path -eq $regKeyWithNoInstallPath }
Assert-Throws { Get-AppCmdLocation -regKeyPath $regKeyWithNoInstallPath } $appCmdMinVersionError

Unregister-Mock Get-ItemProperty

# Test 2: Should throw appcmd not installed exception, Get-ItemProperty for InstallPath returns non-existing path
$regKeyWithNoInstallPath = "HKLM:\SOFTWARE\Microsoft"
$regKey = @{ MajorVersion = "7" 
            InstallPath = "xyz:"}

Register-Mock Get-ItemProperty { return $regKey } -ParametersEvaluator { $Path -eq $regKeyWithNoInstallPath }
Assert-Throws { Get-AppCmdLocation -regKeyPath $regKeyWithNoInstallPath } $appCmdNotFoundError

Unregister-Mock Get-ItemProperty

# Test 3: Should throw exception, Get-ItemProperty for given path throws exception as the reg path does not exist
$regKeyWithNoInstallPath = "HKLM:\SOFTWARE\Microsoft\Invalid"

Assert-Throws { Get-AppCmdLocation -regKeyPath $regKeyWithNoInstallPath } $appCmdNotFoundError

# Test 4: Should not throw exception, Get-ItemProperty for InstallPath and MajorVersion returns proper values
$regKeyWithNoInstallPath = "HKLM:\SOFTWARE\Microsoft"
$regKey = @{ MajorVersion = "7" 
            InstallPath = "$env:SystemDrive"}

Register-Mock Get-ItemProperty { return $regKey } -ParametersEvaluator { $Path -eq $regKeyWithNoInstallPath }
$appCmdPath, $version = Get-AppCmdLocation -regKeyPath $regKeyWithNoInstallPath
Assert-AreEqual "$env:SystemDrive\appcmd.exe" $appCmdPath
Assert-AreEqual 7 $version
