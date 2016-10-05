Import-Module $env:CURRENT_TASK_ROOTDIR\DeploymentSDK\InvokeRemoteDeployment.ps1

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

    $connectionString = EscapeSpecialChars -str $connectionString
    $sqlPassword = EscapeSpecialChars -str $sqlPassword
    $additionalArguments = EscapeSpecialChars -str $additionalArguments
    $serverName = EscapeSpecialChars -str $serverName
    $databaseName = EscapeSpecialChars -str $databaseName

    if ($taskType -eq "dacpac")
    {
        $invokeMain = "ExecuteMain -dacpacFile `"$dacpacFile`" -targetMethod $targetMethod -serverName `"$serverName`" -databaseName `"$databaseName`" -authscheme $authscheme -sqlUsername `"$sqlUsername`" -sqlPassword `"$sqlPassword`" -connectionString `"$connectionString`" -publishProfile `"$publishProfile`" -additionalArguments `"$additionalArguments`""

        $sqlPackageScript = Get-Content .\SqlPackageOnTargetMachines.ps1 | Out-String

        Write-Verbose "Executing main function in SqlPackageOnTargetMachines : $invokeMain"
        $sqlDacpacOnTargetMachinesScript = [string]::Format("{0} {1} ( {2} )", $sqlPackageScript,  [Environment]::NewLine,  $invokeMain)
        return $sqlDacpacOnTargetMachinesScript
    }
    else
    {
        $sqlQueryScript = Get-Content .\SqlQueryOnTargetMachines.ps1 | Out-String

        $invokeExecute = "ExecuteSql -taskType `"$taskType`" -sqlFile `"$sqlFile`" -inlineSql `"$inlineSql`" -serverName `"$serverName`" -databaseName `"$databaseName`" -authscheme $authscheme -sqlUsername `"$sqlUsername`" -sqlPassword `"$sqlPassword`" -additionalArguments `"$additionalArguments`""

        Write-Verbose "Executing main function in SqlQueryOnTargetMachines : $invokeExecute"
        $sqlScriptOnTargetMachines = [string]::Format("{0} {1} ( {2} )", $sqlQueryScript,  [Environment]::NewLine,  $invokeExecute)

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

    $script = GetScriptToRun -dacpacFile $dacpacFile -targetMethod $targetMethod -serverName $serverName -databaseName $databaseName -authscheme $authscheme -sqlUserName $sqlUsername -sqlPassword $sqlPassword -connectionString $connectionString -publishProfile $publishProfile -additionalArguments $additionalArguments -taskType $taskType -inlineSql $inlineSql -sqlFile $sqlFile

    RunRemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel -taskType $taskType
}