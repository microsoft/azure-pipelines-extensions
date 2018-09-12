[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\Utility.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$hostnamewithhttp = "hostnamewithhttp"
$hostnamewithsni = "hostnamewithsni"
$hostnamewithoutsni = "hostnamewithoutsni"

# Test 1: should return hostnamewithhtpp, When protocol is http
$hostname = Get-HostName -protocol "http" -hostNameWithHttp $hostnamewithhttp  -hostNameWithSNI $hostnamewithsni -hostNameWithOutSNI $hostnamewithoutsni -sni "false"
Assert-AreEqual $hostnamewithhttp $hostname

# Test 2: should return hostnamewithhtpp, When protocol is https and sni is true
$hostname = Get-HostName -protocol "https" -hostNameWithHttp $hostnamewithhttp  -hostNameWithSNI $hostnamewithsni -hostNameWithOutSNI $hostnamewithoutsni -sni "true"
Assert-AreEqual $hostnamewithsni $hostname

# Test 3: should return hostnamewithhtpp, When protocol is https and sni is false
$hostname = Get-HostName -protocol "https" -hostNameWithHttp $hostnamewithhttp  -hostNameWithSNI $hostnamewithsni -hostNameWithOutSNI $hostnamewithoutsni -sni "false"
Assert-AreEqual $hostnamewithoutsni $hostname 
