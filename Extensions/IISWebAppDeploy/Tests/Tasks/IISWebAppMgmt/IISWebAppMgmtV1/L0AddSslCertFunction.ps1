[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should not add SslCert, When certhash is empty
Register-Mock Run-Command { return } -ParametersEvaluator { $failOnErr -eq $false }
Add-SslCert -certhash "" -ipAddress "0.0.0.0"
Assert-WasCalled -Command Run-command -Times 0

Unregister-Mock Run-Command

# Test 2: Should not add hostnameport for cert, Given hostnameport for cert exists
Register-Mock Run-Command { return } -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }
Register-Mock Run-Command {return "", "" , "" , "", "HostName:port                : localhost:80", "Certificate Hash             : SampleHash"} -ParametersEvaluator { $failOnErr -eq $false }
$output = Add-SslCert -ipAddress "0.0.0.0" -port "80" -certhash "SampleHash" -hostname "localhost" -sni "true" -iisVersion "8.0" 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains('netsh http show sslcert hostnameport=localhost:80'))
Assert-WasCalled -Command Run-command -Times 1 -ParametersEvaluator { $failOnErr -eq $false }
Assert-WasCalled -Command Run-Command -Times 0 -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }

Unregister-Mock Run-Command

# Test 3: Should add hostnameport entry for given cert, Given hostnameport for cert does not exists
Register-Mock Run-Command { return } -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }
Register-Mock Run-Command {return "", "" , "" , "", "", ""} -ParametersEvaluator { $failOnErr -eq $false }
$output = Add-SslCert -ipAddress "0.0.0.0" -port "80" -certhash "SampleHash" -hostname "localhost" -sni "true" -iisVersion "8.0" 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains('netsh http show sslcert hostnameport=localhost:80'))
Assert-WasCalled -Command Run-command -Times 1 -ParametersEvaluator { $failOnErr -eq $false }
Assert-WasCalled -Command Run-command -Times 1 -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }

Unregister-Mock Run-Command

# Test 4: Should not add cert, Given ipport for cert exists and ipaddress is not 'All Unassigned'
Register-Mock Run-Command { return } -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }
Register-Mock Run-Command {return "", "" , "" , "", "IP:port                      : 10.10.10.10:80", "Certificate Hash             : samplehash"}  -ParametersEvaluator { $failOnErr -eq $false }
$output = Add-SslCert -ipAddress "10.10.10.10" -port "80" -certhash "SampleHash" -sni "false" -iisVersion "8.0" 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains('netsh http show sslcert ipport=10.10.10.10:80'))
Assert-AreEqual $true ($output.Contains('SSL cert binding is already present. Returning'))
Assert-WasCalled -Command Run-command -Times 1 -ParametersEvaluator { $failOnErr -eq $false }
Assert-WasCalled -Command Run-command -Times 0 -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }

Unregister-Mock Run-Command

# Test 5: Should add ipport entry for given cert, Given ipport for cert does not exist and ipaddress is not 'All Unassigned'
Register-Mock Run-Command {return} -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }
Register-Mock Run-Command {return "", "" , "" , "", "", ""}  -ParametersEvaluator { $failOnErr -eq $false }
$output = Add-SslCert -ipAddress "10.10.10.10" -port "80" -certhash "SampleHash" -sni "true" -iisVersion "8.0" 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains('netsh http show sslcert ipport=10.10.10.10:80'))
Assert-WasCalled -Command Run-command -Times 1 -ParametersEvaluator { $failOnErr -eq $false }
Assert-WasCalled -Command Run-command -Times 1 -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }

Unregister-Mock Run-Command

# Test 6: Should not add cert, Given ipport for cert exists and ipaddress is 'All Unassigned'
Register-Mock Run-Command {return} -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }
Register-Mock Run-Command {return "", "" , "" , "", "IP:port                      : 0.0.0.0:80", "Certificate Hash             : samplehash"}  -ParametersEvaluator { $failOnErr -eq $false }
$output = Add-SslCert -ipAddress "All Unassigned" -port "80" -certHash "SampleHash" -sni "true" -ssiVersion "8.0" 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains('netsh http show sslcert ipport=0.0.0.0:80'))
Assert-AreEqual $true ($output.Contains('SSL cert binding is already present. Returning'))
Assert-WasCalled -Command Run-command -Times 1 -ParametersEvaluator {$failOnErr -eq $false}
Assert-WasCalled -Command Run-command -Times 0 -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }

Unregister-Mock Run-Command

# Test 7: Should add ipport entry for given cert with ipaddress of '0.0.0.0', Given ipport for cert does not exist and ipaddress is 'All Unassigned' 
Register-Mock Run-Command {return} -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }
Register-Mock Run-Command {return "", "", "", "", "", ""} -ParametersEvaluator {$failOnErr -eq $false}
$output = Add-SslCert -ipAddress "All Unassigned" -port "80" -certHash "SampleHash" -sni "true" -ssiVersion "8.0" 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains('netsh http show sslcert ipport=0.0.0.0:80'))
Assert-WasCalled -Command Run-command -Times 1 -ParametersEvaluator {$failOnErr -eq $false}
Assert-WasCalled -Command Run-command -Times 1 -ParametersEvaluator { $command -eq "" -or $command.Contains("certhash") }
