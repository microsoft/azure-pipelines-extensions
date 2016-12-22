param (
    [string]$machinesList,
    [string]$adminUserName,
    [string]$adminPassword,
    [string]$winrmProtocol,
    [string]$testCertificate,
    [string]$taskType,
    [string]$dacpacFile,
    [string]$sqlFile,
    [string]$inlineSql,
    [string]$targetMethod,
    [string]$targetMethodSql,
    [string]$serverName,
    [string]$databaseName,
    [string]$authscheme,
    [string]$sqlUsername,
    [string]$sqlPassword,
    [string]$connectionString,
    [string]$publishProfile,
    [string]$additionalArguments,
    [string]$additionalArgumentsSql,
    [string]$deployInParallel
    )

$env:CURRENT_TASK_ROOTDIR = Split-Path -Parent $MyInvocation.MyCommand.Path

. $env:CURRENT_TASK_ROOTDIR\TelemetryHelper\TelemetryHelper.ps1
. $env:CURRENT_TASK_ROOTDIR\DeployToSqlServer.ps1

if ($taskType -ne "dacpac")
{
    $additionalArguments = $additionalArgumentsSql
    $targetMethod = "server"
}

$sqlMainArgs = @{
    machinesList=$machinesList 
    adminUserName=$adminUserName 
    adminPassword=$adminPassword 
    winrmProtocol=$winrmProtocol 
    testCertificate=$testCertificate 
    dacpacFile=$dacpacFile 
    targetMethod=$targetMethod 
    serverName=$serverName 
    databaseName=$databaseName 
    authscheme=$authscheme 
    sqlUsername=$sqlUsername 
    sqlPassword=$sqlPassword 
    connectionString=$connectionString 
    publishProfile=$publishProfile 
    additionalArguments=$additionalArguments 
    deployInParallel=$deployInParallel 
    taskType=$taskType 
    inlineSql=$inlineSql 
    sqlFile=$sqlFile
}

(Main @sqlMainArgs)