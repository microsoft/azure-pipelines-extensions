[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$ipAddress = "All Unassigned"

# Test 1: Should not enable SNI, Enable SNI should return if iisVerision is less than 8
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation {return "", 7}
Enable-SNI -siteName "SampleWeb" -sni "true" -ipAddress $ipAddress -port "80" -hostname "localhost"
Assert-WasCalled Get-AppCmdLocation
Assert-WasCalled -Command Run-Command -Times 0

Unregister-Mock Run-Command
Unregister-Mock Get-AppCmdLocation

# Test 2: Should not enable SNI, Enable SNI should return if SNI is false
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation {return "", 8}
Enable-SNI -siteName "SampleWeb" -sni "false" -ipAddress $ipAddress -port "80" -hostname "localhost"
Assert-WasCalled Get-AppCmdLocation
Assert-WasCalled -Command Run-Command -Times 0

Unregister-Mock Run-Command
Unregister-Mock Get-AppCmdLocation

# Test 3: Should not enable SNI, Enable SNI should return if hostname is empty
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation {return "", 8}
Enable-SNI -siteName "SampleWeb" -sni "true" -ipAddress $ipAddress -port "80" -hostname ""
Assert-WasCalled Get-AppCmdLocation
Assert-WasCalled -Command Run-Command -Times 0

Unregister-Mock Run-Command
Unregister-Mock Get-AppCmdLocation

# Test 4: Should enable SNI, Enable SNI should succeed for valid inputs
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation {return "", 8}
$output = Enable-SNI -siteName "SampleWeb" -sni "true" -ipAddress $ipAddress -port "80" -hostname "localhost" 4>&1 | Out-String
Assert-AreEqual $true ( $output.Contains('].sslFlags:"1"') )
Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation

Unregister-Mock Run-Command
Unregister-Mock Get-AppCmdLocation

# Test 5: Should enable SNI, Enable SNI should succeed for website with spaces
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation {return "", 8}
$output = Enable-SNI -siteName "Sample Web" -sni "true" -ipAddress $ipAddress -port "80" -hostname "localhost" 4>&1 | Out-String
Assert-AreEqual $true ( $output.Contains('/site.name:"Sample Web"') )
Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation
