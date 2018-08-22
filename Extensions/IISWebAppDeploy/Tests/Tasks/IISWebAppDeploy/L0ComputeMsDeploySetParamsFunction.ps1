[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\MsDeployOnTargetMachines.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Shouldn't alter override params when override params for websitename is already present
$result = Compute-MsDeploy-SetParams -websiteName "dummyWebsite2" -overRideParams 'name="IIS Web Application Name",value="dummyWebsite"'

Assert-AreEqual $result 'name="IIS Web Application Name",value="dummyWebsite"'

# Test 2: Should add setParam to deploy on website When no override params is given
$result = Compute-MsDeploy-SetParams -websiteName "dummyWebsite"

Assert-AreEqual ($result.Contains('name="IIS Web Application Name",value="dummyWebsite"')) $true

# Test 3: Should add setParam to deploy on website When override params contain db connection string override
$result = Compute-MsDeploy-SetParams -websiteName "dummyWebsite" -overRideParams 'name="ConnectionString",value="DummyConnectionString"'

Assert-AreEqual ($result.Contains('name="IIS Web Application Name",value="dummyWebsite"')) $true
