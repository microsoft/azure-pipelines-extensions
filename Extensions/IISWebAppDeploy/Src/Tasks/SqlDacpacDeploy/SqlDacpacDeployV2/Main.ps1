[CmdletBinding()]
param()

Trace-VstsEnteringInvocation $MyInvocation

$env:CURRENT_TASK_ROOTDIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Import-Module $env:CURRENT_TASK_ROOTDIR\ps_modules\VstsTaskSdk
Import-Module $env:CURRENT_TASK_ROOTDIR\ps_modules\Sanitizer

# Get inputs for the task
$machinesList = Get-VstsInput -Name machinesList -Require
$adminUserName = Get-VstsInput -Name AdminUserName -Require
$adminPassword = Get-VstsInput -Name AdminPassword -Require
$winrmProtocol = Get-VstsInput -Name WinRMProtocol
$testCertificate = Get-VstsInput -Name TestCertificate -AsBool
$taskType = Get-VstsInput -Name TaskType -Require
$dacpacFile = Get-VstsInput -Name DacpacFile
$sqlFile = Get-VstsInput -Name SqlFile
$inlineSql = Get-VstsInput -Name InlineSql
$targetMethod = Get-VstsInput -Name TargetMethod
$serverName = Get-VstsInput -Name ServerName
$databaseName = Get-VstsInput -Name DatabaseName
$authscheme = Get-VstsInput -Name AuthScheme
$sqlUsername = Get-VstsInput -Name SqlUsername
$sqlPassword = Get-VstsInput -Name SqlPassword
$connectionString = Get-VstsInput -Name ConnectionString
$publishProfile = Get-VstsInput -Name PublishProfile
$additionalArguments = Get-VstsInput -Name AdditionalArguments
$additionalArgumentsSql = Get-VstsInput -Name AdditionalArgumentsSql
$deployInParallel = Get-VstsInput -Name DeployInParallel -AsBool

try
{
    if ([Console]::InputEncoding -is [Text.UTF8Encoding] -and [Console]::InputEncoding.GetPreamble().Length -ne 0) 
    { 
	    Write-Verbose "Resetting input encoding."
	    [Console]::InputEncoding = New-Object Text.UTF8Encoding $false 
    }

    . $env:CURRENT_TASK_ROOTDIR\TelemetryHelper\TelemetryHelper.ps1
    . $env:CURRENT_TASK_ROOTDIR\DeployToSqlServer.ps1

    if ($taskType -ne "dacpac")
    {
        $additionalArguments = $additionalArgumentsSql
        $targetMethod = "server"
    }

    $useSanitizerCall = Get-SanitizerCallStatus
    $useSanitizerActivate = Get-SanitizerActivateStatus

    if ($useSanitizerCall) 
    {
        $sanitizedArguments = Protect-ScriptArguments -InputArgs $appCmdCommands -TaskName "SqlDacpacDeployV2"
    }

    if ($useSanitizerActivate) 
    {
        $appCmdCommands = $sanitizedArguments
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
}
catch
{
    Write-Verbose $_.Exception.ToString() -Verbose
    throw
}
finally
{
    Trace-VstsLeavingInvocation $MyInvocation
}