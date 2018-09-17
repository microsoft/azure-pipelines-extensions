[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\Utility.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

$actionIISWebsite = "CreateOrUpdateWebsite"
$websiteName = "Sample Web Site"
$startStopWebsiteName = ""
$websitePhysicalPath = "Drive:\Physical Path"
$websitePhysicalPathAuth = "WebsiteUserPassThrough"
$websiteAuthUserName = ""
$websiteAuthUserPassword = ""
$addBinding = "true"
$protocol = "http"
$ipAddress = "10.0.0.1"
$port = "1234"
$createOrUpdateAppPoolForWebsite = "false"
$appPoolNameForWebsite = "Sample App Pool"
$dotNetVersionForWebsite = "v4.0"
$pipeLineModeForWebsite = "Integrated"
$appPoolIdentityForWebsite = "ApplicationPoolIdentity"
$appPoolUsernameForWebsite = ""
$appPoolPasswordForWebsite = ""
$configureAuthenticationForWebsite = "true"
$anonymousAuthenticationForWebsite = "false"
$basicAuthenticationForWebsite = "true"
$windowsAuthenticationForWebsite = "true"
$appCmdCommands = ""

$bindingsArray = @(@{
    protocol = $protocol.Trim();
    ipAddress = $ipAddress.Trim();
    port = $port.Trim();
    sniFlag = "";
    sslThumbprint = Test-SSLCertificateThumbprint -sslCertThumbPrint $sslCertThumbPrint -ipAddress $ipAddress -protocol $protocol -port $port ;
    hostname = Get-Hostname -port $port -hostNameWithSNI $hostNameWithSNI -hostNameWithHttp $hostNameWithHttp -hostNameWithOutSNI $hostNameWithOutSNI -sni $serverNameIndication ;
})

$bindingsJson = $bindingsArray | ConvertTo-Json
$bindingsJson = Escape-SpecialChars $bindingsJson

# Test 1

$result = Set-IISWebsite -actionIISWebsite $actionIISWebsite -websiteName $websiteName -startStopWebsiteName $startStopWebsiteName -physicalPath $websitePhysicalPath -physicalPathAuth $websitePhysicalPathAuth -physicalPathAuthUserName $websiteAuthUserName -physicalPathAuthUserPassword $websiteAuthUserPassword `
                -addBinding $addBinding -protocol $protocol -ipAddress $ipAddress -port $port -serverNameIndication $serverNameIndication `
                -hostNameWithOutSNI $hostNameWithOutSNI -hostNameWithHttp $hostNameWithHttp -hostNameWithSNI $hostNameWithSNI -sslCertThumbPrint $sslCertThumbPrint `
                -createOrUpdateAppPool $createOrUpdateAppPoolForWebsite -appPoolName $appPoolNameForWebsite -dotNetVersion $dotNetVersionForWebsite -pipeLineMode $pipeLineModeForWebsite -appPoolIdentity $appPoolIdentityForWebsite -appPoolUsername $appPoolUsernameForWebsite -appPoolPassword $appPoolPasswordForWebsite `
                -configureAuthentication $configureAuthenticationForWebsite -anonymousAuthentication $anonymousAuthenticationForWebsite -basicAuthentication $basicAuthenticationForWebsite -windowsAuthentication $windowsAuthenticationForWebsite -appCmdCommands $appCmdCommands

Assert-AreEqual ('Invoke-Main -ActionIISWebsite CreateOrUpdateWebsite -WebsiteName "Sample Web Site" -PhysicalPath "Drive:\Physical Path" -PhysicalPathAuth "WebsiteUserPassThrough" -PhysicalPathAuthUsername "" -PhysicalPathAuthUserPassword "" -AddBinding true -Bindings "{0}" -configureAuthentication true -anonymousAuthentication false -basicAuthentication true -windowsAuthentication true -AppCmdCommands ""' -f $bindingsJson) $result

#Test 2 

$createOrUpdateAppPoolForWebsite = "true"
$websitePhysicalPathAuth = "WebsiteWindowsAuth"
$websiteAuthUserName = "name"
$websiteAuthUserPassword = "pass"

$appPoolIdentityForWebsite = "SpecificUser"
$appPoolUsernameForWebsite = "name"
$appPoolPasswordForWebsite = "pass"

Register-Mock Get-CustomCredentials { return "CustomCredentialsObject" }

$result = Set-IISWebsite -actionIISWebsite $actionIISWebsite -websiteName $websiteName -startStopWebsiteName $startStopWebsiteName -physicalPath $websitePhysicalPath -physicalPathAuth $websitePhysicalPathAuth -physicalPathAuthUserName $websiteAuthUserName -physicalPathAuthUserPassword $websiteAuthUserPassword `
                -addBinding $addBinding -protocol $protocol -ipAddress $ipAddress -port $port -serverNameIndication $serverNameIndication `
                -hostNameWithOutSNI $hostNameWithOutSNI -hostNameWithHttp $hostNameWithHttp -hostNameWithSNI $hostNameWithSNI -sslCertThumbPrint $sslCertThumbPrint `
                -createOrUpdateAppPool $createOrUpdateAppPoolForWebsite -appPoolName $appPoolNameForWebsite -dotNetVersion $dotNetVersionForWebsite -pipeLineMode $pipeLineModeForWebsite -appPoolIdentity $appPoolIdentityForWebsite -appPoolUsername $appPoolUsernameForWebsite -appPoolPassword $appPoolPasswordForWebsite `
                -configureAuthentication $configureAuthenticationForWebsite -anonymousAuthentication $anonymousAuthenticationForWebsite -basicAuthentication $basicAuthenticationForWebsite -windowsAuthentication $windowsAuthenticationForWebsite -appCmdCommands $appCmdCommands

Assert-AreEqual ('Invoke-Main -ActionIISWebsite CreateOrUpdateWebsite -WebsiteName "Sample Web Site" -PhysicalPath "Drive:\Physical Path" -PhysicalPathAuth "WebsiteWindowsAuth" -PhysicalPathAuthUsername "name" -PhysicalPathAuthUserPassword "pass" -AddBinding true -Bindings "{0}" -ActionIISApplicationPool "CreateOrUpdateAppPool" -AppPoolName "Sample App Pool" -DotNetVersion "v4.0" -PipeLineMode "Integrated" -AppPoolIdentity SpecificUser -AppPoolUsername "name" -AppPoolPassword "pass" -configureAuthentication true -anonymousAuthentication false -basicAuthentication true -windowsAuthentication true -AppCmdCommands ""' -f $bindingsJson) $result

# Test 3

$actionIISWebsite = "StartWebsite"
$startStopWebsiteName = "Sample Web Site"

$result = Set-IISWebsite -actionIISWebsite $actionIISWebsite -websiteName $websiteName -startStopWebsiteName $startStopWebsiteName -physicalPath $websitePhysicalPath -physicalPathAuth $websitePhysicalPathAuth -physicalPathAuthUserName $websiteAuthUserName -physicalPathAuthUserPassword $websiteAuthUserPassword `
                -addBinding $addBinding -protocol $protocol -ipAddress $ipAddress -port $port -serverNameIndication $serverNameIndication `
                -hostNameWithOutSNI $hostNameWithOutSNI -hostNameWithHttp $hostNameWithHttp -hostNameWithSNI $hostNameWithSNI -sslCertThumbPrint $sslCertThumbPrint `
                -createOrUpdateAppPool $createOrUpdateAppPoolForWebsite -appPoolName $appPoolNameForWebsite -dotNetVersion $dotNetVersionForWebsite -pipeLineMode $pipeLineModeForWebsite -appPoolIdentity $appPoolIdentityForWebsite -appPoolUsername $appPoolUsernameForWebsite -appPoolPassword $appPoolPasswordForWebsite `
                -configureAuthentication $configureAuthenticationForWebsite -anonymousAuthentication $anonymousAuthenticationForWebsite -basicAuthentication $basicAuthenticationForWebsite -windowsAuthentication $windowsAuthenticationForWebsite -appCmdCommands $appCmdCommands

Assert-AreEqual 'Invoke-Main -ActionIISWebsite StartWebsite -WebsiteName "Sample Web Site" -AppCmdCommands ""' $result

# Test 4

$actionIISWebsite = "StopWebsite"
$startStopWebsiteName = "Sample Web Site"

$result = Set-IISWebsite -actionIISWebsite $actionIISWebsite -websiteName $websiteName -startStopWebsiteName $startStopWebsiteName -physicalPath $websitePhysicalPath -physicalPathAuth $websitePhysicalPathAuth -physicalPathAuthUserName $websiteAuthUserName -physicalPathAuthUserPassword $websiteAuthUserPassword `
                -addBinding $addBinding -protocol $protocol -ipAddress $ipAddress -port $port -serverNameIndication $serverNameIndication `
                -hostNameWithOutSNI $hostNameWithOutSNI -hostNameWithHttp $hostNameWithHttp -hostNameWithSNI $hostNameWithSNI -sslCertThumbPrint $sslCertThumbPrint `
                -createOrUpdateAppPool $createOrUpdateAppPoolForWebsite -appPoolName $appPoolNameForWebsite -dotNetVersion $dotNetVersionForWebsite -pipeLineMode $pipeLineModeForWebsite -appPoolIdentity $appPoolIdentityForWebsite -appPoolUsername $appPoolUsernameForWebsite -appPoolPassword $appPoolPasswordForWebsite `
                -configureAuthentication $configureAuthenticationForWebsite -anonymousAuthentication $anonymousAuthenticationForWebsite -basicAuthentication $basicAuthenticationForWebsite -windowsAuthentication $windowsAuthenticationForWebsite -appCmdCommands $appCmdCommands

Assert-AreEqual 'Invoke-Main -ActionIISWebsite StopWebsite -WebsiteName "Sample Web Site" -AppCmdCommands ""' $result

# Test 5

$actionIISWebsite = "InvalidOption"

Assert-Throws {
    Set-IISWebsite -actionIISWebsite $actionIISWebsite -websiteName $websiteName -startStopWebsiteName $startStopWebsiteName -physicalPath $websitePhysicalPath -physicalPathAuth $websitePhysicalPathAuth -physicalPathAuthUserName $websiteAuthUserName -physicalPathAuthUserPassword $websiteAuthUserPassword `
                -addBinding $addBinding -protocol $protocol -ipAddress $ipAddress -port $port -serverNameIndication $serverNameIndication `
                -hostNameWithOutSNI $hostNameWithOutSNI -hostNameWithHttp $hostNameWithHttp -hostNameWithSNI $hostNameWithSNI -sslCertThumbPrint $sslCertThumbPrint `
                -createOrUpdateAppPool $createOrUpdateAppPoolForWebsite -appPoolName $appPoolNameForWebsite -dotNetVersion $dotNetVersionForWebsite -pipeLineMode $pipeLineModeForWebsite -appPoolIdentity $appPoolIdentityForWebsite -appPoolUsername $appPoolUsernameForWebsite -appPoolPassword $appPoolPasswordForWebsite `
                -configureAuthentication $configureAuthenticationForWebsite -anonymousAuthentication $anonymousAuthenticationForWebsite -basicAuthentication $basicAuthenticationForWebsite -windowsAuthentication $windowsAuthenticationForWebsite -appCmdCommands $appCmdCommands
} -MessagePattern 'Invalid action "InvalidOption" selected for the IIS Website.'