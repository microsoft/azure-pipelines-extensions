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

if ([Console]::InputEncoding -is [Text.UTF8Encoding] -and [Console]::InputEncoding.GetPreamble().Length -ne 0) 
{ 
	Write-Verbose "Resetting input encoding."
	[Console]::InputEncoding = New-Object Text.UTF8Encoding $false 
}

$env:CURRENT_TASK_ROOTDIR = Split-Path -Parent $MyInvocation.MyCommand.Path

. $env:CURRENT_TASK_ROOTDIR\TelemetryHelper\TelemetryHelper.ps1
. $env:CURRENT_TASK_ROOTDIR\DeployToSqlServer.ps1

if ($taskType -ne "dacpac")
{
    $additionalArguments = $additionalArgumentsSql
    $targetMethod = "server"
}

# Telemetry for SQL Dacpac deployment
$encodedServerName = GetSHA256String($serverName)
$encodedDatabaseName = GetSHA256String($databaseName)
$telemetryJsonContent = -join("{`"serverName`": `"$encodedServerName`",",
                              "`"databaseName`": `"$encodedDatabaseName`"}")
Write-Host "##vso[telemetry.publish area=SqlTelemetry;feature=SqlDacpacDeploy]$telemetryJsonContent"

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