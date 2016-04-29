param (
    [string]$machinesList,
    [string]$adminUserName,
    [string]$adminPassword,
    [string]$winrmProtocol,
    [string]$testCertificate,
    [string]$createWebsite,
    [string]$websiteName,
    [string]$websitePhysicalPath,
    [string]$websitePhysicalPathAuth,
    [string]$websiteAuthUserName,
    [string]$websiteAuthUserPassword,
    [string]$addBinding,
    [string]$protocol,
    [string]$ipAddress,
    [string]$port,
    [string]$hostNameWithHttp,
    [string]$hostNameWithOutSNI,
    [string]$hostNameWithSNI,
    [string]$serverNameIndication,
    [string]$sslCertThumbPrint,
    [string]$createAppPool,
    [string]$appPoolName,
    [string]$dotNetVersion,
    [string]$pipeLineMode,
    [string]$appPoolIdentity,
    [string]$appPoolUsername,
    [string]$appPoolPassword,
    [string]$appCmdCommands,
    [string]$deployInParallel
    )

$env:CURRENT_TASK_ROOTDIR = Split-Path -Parent $MyInvocation.MyCommand.Path

. $env:CURRENT_TASK_ROOTDIR\ManageIISWebApp.ps1

(Main -machinesList $machinesList -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $winrmProtocol -testCertificate $testCertificate -createWebsite $createWebsite -websiteName "$websiteName" -websitePhysicalPath "$websitePhysicalPath" -websitePhysicalPathAuth "$websitePhysicalPathAuth" -websiteAuthUserName "$websiteAuthUserName" -websiteAuthUserPassword "$websiteAuthUserPassword" -addBinding $addBinding -protocol $protocol -ipAddress "$ipAddress" -port $port -hostNameWithHttp "$hostNameWithHttp" -hostNameWithOutSNI "$hostNameWithOutSNI" -hostNameWithSNI "$hostNameWithSNI" -serverNameIndication $serverNameIndication -sslCertThumbPrint "$sslCertThumbPrint" -createAppPool $createAppPool -appPoolName "$appPoolName" -dotNetVersion $dotNetVersion -pipeLineMode $pipeLineMode -appPoolIdentity $appPoolIdentity -appPoolUsername "$appPoolUsername" -appPoolPassword "$appPoolPassword" -appCmdCommands "$appCmdCommands" -deployInParallel $deployInParallel)