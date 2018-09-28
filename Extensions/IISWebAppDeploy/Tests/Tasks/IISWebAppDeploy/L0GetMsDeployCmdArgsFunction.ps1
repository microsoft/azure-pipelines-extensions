[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\MsDeployOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$websiteName = "SampleWebApp"
$webDeployPackage = "WebAppPackage.zip"
$webDeployParamFile = "webDeployParamFile.xml"
$overRideParams = "Param=Value"

Register-Mock Test-Path { return $true }

# Test 1: When webdeploy package input only provided, msDeployCmdArgs should only contain -source:packge
$result = Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webDeployPackage

Assert-AreEqual ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) $true
Assert-AreEqual ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) ) $false
Assert-AreEqual ( $result.Contains("-setParam:$overRideParams") ) $false

# Test 2: When webdeploy and setParamFiles input only provided, msDeployCmdArgs should only contain -source:packge and -setParamFile
$result = Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile

Assert-AreEqual ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) $true
Assert-AreEqual ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) ) $true
Assert-AreEqual ( $result.Contains("-setParam:$overRideParams") ) $false

# Test 3: When all three inputs are provided with additional args, msDeployCmdArgs should contain -source:packge, -setParamFile and -setParam
$result = Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -overRideParams $overRideParams -additionalArguments "args"

Assert-AreEqual ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) $true
Assert-AreEqual ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) ) $true
Assert-AreEqual ( $result.Contains("-setParam:$overRideParams") ) $true
Assert-AreEqual ( $result.Contains(" args") ) $true

Unregister-Mock Test-Path

# Test 4: When webDeploy package does not exist, Should throw exception
$InvalidPkg = "n:\Invalid\pkg.zip"
$errMsg = "Package does not exist : `"$InvalidPkg`""

Assert-Throws { Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $InvalidPkg -webDeployParamFile $webDeployParamFile -overRideParams $overRideParams } $errMsg

# Test 5: When setParamFile does not exist, Should throw exception
Register-Mock Test-Path { return $true } -ParametersEvaluator { $Path -eq $webDeployPackage }
$InvalidParamFile = "n:\Invalid\param.xml"
$errMsg = "Param file does not exist : `"$InvalidParamFile`""

Assert-Throws { Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webDeployPackage -webDeployParamFile $InvalidParamFile -overRideParams $overRideParams } $errMsg

Unregister-Mock Test-Path

# Test 6: When two override params is given, msDeployCmdArgs should contain -source:packge, -setParamFile and -setParam for each override param
$param1 = "name1=value1"
$param2 = "name2=value2"

$params = $param1 + [System.Environment]::NewLine + $param2

Register-Mock Test-Path { return $true }

$result = Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -overRideParams $params

Assert-AreEqual ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) $true
Assert-AreEqual ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) ) $true
Assert-AreEqual ( $result.Contains("-setParam:$param1") ) $true
Assert-AreEqual ( $result.Contains("-setParam:$param2") ) $true

# Test 7: When two override params with an empty line in between is given, msDeployCmdArgs should contain -source:packge, -setParamFile and -setParam for each override param
$param1 = "name1=value1"
$param2 = " "
$param3 = "name2=value2"

$params = $param1 + [System.Environment]::NewLine + $param2 + [System.Environment]::NewLine + $param3

$result = Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -overRideParams $params

Assert-AreEqual ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) $true
Assert-AreEqual ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) ) $true
Assert-AreEqual ( $result.Contains("-setParam:$param1") ) $true
Assert-AreEqual ( $result.Contains("-setParam:$param2") ) $false
Assert-AreEqual ( $result.Contains("-setParam:$param3") ) $true

# Test 8: When two override params with an new line in between is given, msDeployCmdArgs should contain -source:packge, -setParamFile and -setParam for each override param
$param1 = " name1=value1"
$param2 = "name2=value2"

$params = $param1 + [System.Environment]::NewLine + [System.Environment]::NewLine + [System.Environment]::NewLine + $param2

$result = Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -overRideParams $params

Assert-AreEqual ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) $true
Assert-AreEqual ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) ) $true
Assert-AreEqual ( $result.Contains([string]::Format("-setParam:{0}", $param1.Trim()))) $true
Assert-AreEqual ( $result.Contains("-setParam:$param2") ) $true
Assert-AreEqual ( $result.Contains([string]::Format('-setParam:{0}', [System.Environment]::NewLine) ) ) $false

# Test 9: When removeAdditionalFiles, takeAppOffline, excludeFilesFromAppData are true, msDeployCmdArgs should contain -source:packge, -setParamFile and -setParam
$result = Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -overRideParams $overRideParams -removeAdditionalFiles "true" -excludeFilesFromAppData "true" -takeAppOffline "true"

Assert-AreEqual ( $result.Contains("-enableRule:DoNotDeleteRule") ) $false
Assert-AreEqual ( $result.Contains("-enableRule:AppOffline") ) $true
Assert-AreEqual ( $result.Contains('-skip:Directory="\\App_Data"') ) $true

# Test 10: When removeAdditionalFiles, takeAppOffline, excludeFilesFromAppData are false, msDeployCmdArgs should contain -source:packge, -setParamFile and -setParam
$result = Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -overRideParams $overRideParams -removeAdditionalFiles "false" -excludeFilesFromAppData "false" -takeAppOffline "false"

Assert-AreEqual ( $result.Contains("-enableRule:DoNotDeleteRule") ) $true
Assert-AreEqual ( $result.Contains("-enableRule:AppOffline") ) $false
Assert-AreEqual ( $result.Contains('-skip:Directory="\\App_Data"') ) $false

# Test 11: When folder is provided as input, msDeployCmdArgs should only contain -source:iisApp
$webAppFolder = "WebAppFolder"

$result = Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webAppFolder -isInputFolder $true

Assert-AreEqual ( $result.Contains([string]::Format('-source:iisApp="{0}"', $webAppFolder) ) ) $true
Assert-AreEqual ( $result.Contains([string]::Format('-dest:iisApp="{0}"', $websiteName) ) ) $true
