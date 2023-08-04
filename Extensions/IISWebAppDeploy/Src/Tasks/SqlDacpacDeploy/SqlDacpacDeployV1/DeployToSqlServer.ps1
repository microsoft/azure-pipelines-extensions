﻿Import-Module $env:CURRENT_TASK_ROOTDIR\DeploymentSDK\InvokeRemoteDeployment.ps1
Import-Module $env:CURRENT_TASK_ROOTDIR\DeploymentSDK\Utility.ps1

function EscapeSpecialChars
{
    param(
        [string]$str
    )

    return $str.Replace('`', '``').Replace('"', '`"').Replace('$', '`$')
}

function TrimInputs([ref]$adminUserName, [ref]$sqlUsername, [ref]$dacpacFile, [ref]$publishProfile, [ref]$sqlFile)
{
    Write-Verbose "Triming inputs for excess spaces, double quotes"

    $adminUserName.Value = $adminUserName.Value.Trim()
    $sqlUsername.Value = $sqlUsername.Value.Trim()    

    $dacpacFile.Value = $dacpacFile.Value.Trim('"', ' ')
    $publishProfile.Value = $publishProfile.Value.Trim('"', ' ')
    $sqlFile = $sqlFile.Value.Trim('"', ' ')
}

function RunRemoteDeployment
{
    param(
        [string]$machinesList,
        [string]$scriptToRun,
        [string]$adminUserName,
        [string]$adminPassword,
        [string]$winrmProtocol,
        [string]$testCertificate,
        [string]$deployInParallel,
        [string]$taskType
    )

    Write-Host "Starting deployment using $taskType"

    $errorMessage = Invoke-RemoteDeployment -machinesList $machinesList -scriptToRun $scriptToRun -adminUserName $adminUserName -adminPassword $adminPassword -protocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel

    if(-not [string]::IsNullOrEmpty($errorMessage))
    {
        $helpMessage = "For more info please refer to http://aka.ms/sqlserverdacpackreadme)"
        Write-Error "$errorMessage`n$helpMessage"
        return
    }

    Write-Host "Successfully deployed using $taskType"
}

function GetScriptToRun
{
    param (
        [string]$taskType,
        [string]$dacpacFile,
        [string]$sqlFile,
        [string]$inlineSql,
        [string]$targetMethod,
        [string]$serverName,
        [string]$databaseName,
        [string]$authscheme,
        [string]$sqlUserName,
        [string]$sqlPassword,
        [string]$connectionString,
        [string]$publishProfile,
        [string]$additionalArguments
    )

    if($sqlUserName -and $sqlPassword)
    {
        $securePasswordScript = "`$secureAdminPassword = ConvertTo-SecureString `"$sqlPassword`"  -AsPlainText -Force"
        $psCredentialCreationScript = "`$sqlServerCredentials = New-Object System.Management.Automation.PSCredential (`"$sqlUserName`", `$secureAdminPassword)" 
        $initScript = [string]::Format("{0} {1} {2}", $securePasswordScript, [Environment]::NewLine,  $psCredentialCreationScript)
    }

    $utilityScript = Get-Content DeploymentSDK\Utility.ps1 | Out-String
    if ($taskType -eq "dacpac")
    {
        
        $sqlPackageScript = Get-Content TaskModuleSqlUtility\SqlPackageOnTargetMachines.ps1 | Out-String
        $sqlPackageScript = [string]::Format("{0} {1} {2}", $sqlPackageScript, [Environment]::NewLine, $utilityScript)

        try{
            $sqlSplatArguments = @{
                dacpacFile=$dacpacFile 
                targetMethod=$targetMethod 
                serverName=$serverName
                databaseName=$databaseName
                authscheme=$authscheme 
                sqlServerCredentials="`$sqlServerCredentials"
                connectionString=$connectionString 
                publishProfile=$publishProfile 
                additionalArguments=$additionalArguments
            }
            $jsonSqlSplatArguments = convertTo-JsonFormat -InputObject $sqlSplatArguments
            $remoteArgsInit = "`$remoteJsonSqlSplattedArgs = '$jsonSqlSplatArguments'
                `$splattedArgsObject = ConvertFrom-JsonFormat -InputObject `$remoteJsonSqlSplattedArgs 
                `$remoteSqlDacpacArgs = @{
                    dacpacFile=`$splattedArgsObject.dacpacFile
                    targetMethod=`$splattedArgsObject.targetMethod
                    serverName=`$splattedArgsObject.serverName
                    databaseName=`$splattedArgsObject.databaseName
                    authscheme=`$splattedArgsObject.authscheme
                    sqlServerCredentials=`$sqlServerCredentials
                    connectionString=`$splattedArgsObject.connectionString
                    publishProfile=`$splattedArgsObject.publishProfile
                    additionalArguments=`$splattedArgsObject.additionalArguments
                }"

            $invokeMain = "Invoke-DacpacDeployment @remoteSqlDacpacArgs"
        }
        catch
        {
            Write-Verbose $_.Exception
            throw "Failed to create splat arguments for sql dacpac deployment"
        }
        

        Write-Verbose "Executing main function in SqlPackageOnTargetMachines : $invokeMain"
        $sqlDacpacOnTargetMachinesScript = [string]::Format("{0} {1} {2} {3} {4} {5} {6}", $sqlPackageScript,  [Environment]::NewLine, $initScript, [Environment]::NewLine,  $remoteArgsInit, [Environment]::NewLine, $invokeMain)
        return $sqlDacpacOnTargetMachinesScript
    }
    else
    {
        $sqlQueryScript = Get-Content TaskModuleSqlUtility\SqlQueryOnTargetMachines.ps1 | Out-String
        $sqlQueryScript = [string]::Format("{0} {1} {2}", $sqlQueryScript, [Environment]::NewLine, $utilityScript)

        try{
            $sqlSplatArguments = @{
                taskType=$taskType
                sqlFile=$sqlFile
                inlineSql=$inlineSql
                serverName=$serverName
                databaseName=$databaseName
                authscheme=$authscheme
                sqlServerCredentials="`$sqlServerCredentials"
                additionalArguments=$additionalArguments
            }
            $jsonSqlSplatArguments = ConvertTo-JsonFormat -InputObject $sqlSplatArguments
            $remoteArgsInit = "`$remoteJsonSqlSplattedArgs = '$jsonSqlSplatArguments'
                `$splattedArgsObject = ConvertFrom-JsonFormat -InputObject `$remoteJsonSqlSplattedArgs
                `$remoteSplattedSql = @{
                    taskType=`$splattedArgsObject.taskType
                    sqlFile=`$splattedArgsObject.sqlFile
                    inlineSql=`$splattedArgsObject.inlineSql
                    serverName=`$splattedArgsObject.serverName
                    databaseName=`$splattedArgsObject.databaseName
                    authscheme=`$splattedArgsObject.authscheme
                    sqlServerCredentials=`$sqlServerCredentials
                    additionalArguments=`$splattedArgsObject.additionalArguments
                }"
            $invokeExecute = "Invoke-SqlQueryDeployment @remoteSplattedSql"
        }
        catch
        {
            Write-Verbose $_.Exception
            throw "Failed to create splat arguments for sql query execution"
        }


        Write-Verbose "Executing main function in SqlQueryOnTargetMachines : $invokeExecute"
        $sqlScriptOnTargetMachines = [string]::Format("{0} {1} {2} {3} {4} {5} {6}", $sqlQueryScript,  [Environment]::NewLine, $initScript, [Environment]::NewLine,  $remoteArgsInit,[Environment]::NewLine, $invokeExecute)

        return $sqlScriptOnTargetMachines
    }
}

function Main
{
    param (
    [string]$machinesList,
    [string]$adminUserName,
    [string]$adminPassword,
    [string]$winrmProtocol,
    [string]$testCertificate,
    [String]$taskType,
    [string]$dacpacFile,
    [string]$sqlFile,
    [string]$inlineSql,
    [string]$targetMethod,
    [string]$serverName,
    [string]$databaseName,
    [string]$authscheme,
    [string]$sqlUsername,
    [string]$sqlPassword,
    [string]$connectionString,
    [string]$publishProfile,
    [string]$additionalArguments,
    [string]$deployInParallel
    )

    Write-Verbose "Entering script DeployToSqlServer.ps1"
    Write-Verbose "machinesList = $machinesList"
    Write-Verbose "adminUserName = $adminUserName"
    Write-Verbose "winrmProtocol  = $winrmProtocol"
    Write-Verbose "testCertificate = $testCertificate"
    Write-Verbose "TaskType = $taskType"
    Write-Verbose "dacpacFile = $dacpacFile"
    Write-Verbose "sqlFile = $sqlFile"
    Write-Verbose "targetMethod = $targetMethod"
    Write-Verbose "serverName = $serverName"
    Write-Verbose "databaseName = $databaseName"
    Write-Verbose "authscheme = $authscheme"
    Write-Verbose "sqlUsername = $sqlUsername"
    Write-Verbose "publishProfile = $publishProfile"
    Write-Verbose "additionalArguments = $additionalArguments"
    Write-Verbose "deployInParallel = $deployInParallel"
    Write-Verbose "inlineSql = $inlineSql"

    TrimInputs -adminUserName([ref]$adminUserName) -sqlUsername ([ref]$sqlUsername) -dacpacFile ([ref]$dacpacFile) -publishProfile ([ref]$publishProfile) -sqlFile ([ref]$sqlFile)

    $scriptBuilderArgs = @{
        dacpacFile=$dacpacFile 
        targetMethod=$targetMethod 
        serverName=$serverName 
        databaseName=$databaseName 
        authscheme=$authscheme 
        sqlUserName=$sqlUsername 
        sqlPassword=$sqlPassword 
        connectionString=$connectionString 
        publishProfile=$publishProfile 
        additionalArguments=$additionalArguments 
        taskType=$taskType 
        inlineSql=$inlineSql 
        sqlFile=$sqlFile
    }

    $script = GetScriptToRun @scriptBuilderArgs

    $remoteDeploymentArgs = @{
        machinesList=$machinesList 
        scriptToRun=$script 
        adminUserName=$adminUserName 
        adminPassword=$adminPassword 
        winrmProtocol=$winrmProtocol 
        testCertificate=$testCertificate 
        deployInParallel=$deployInParallel 
        taskType=$taskType
    }

    RunRemoteDeployment @remoteDeploymentArgs
}

function GetSHA256String {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$false)]
        [string] $inputString)

     if ($inputString) {
        $hashHandler = [System.Security.Cryptography.HashAlgorithm]::Create('sha256')
        $hash = $hashHandler.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($inputString.ToLower()))

         $hashString = [System.BitConverter]::ToString($hash)
        $hashString = $hashString.Replace('-', '').ToLower()
        return $hashString;
    }

     return ""
}
