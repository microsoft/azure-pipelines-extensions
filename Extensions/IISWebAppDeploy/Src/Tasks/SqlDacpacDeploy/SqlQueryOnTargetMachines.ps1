# Function to import SqlPS module & avoid directory switch
function Import-SqlPs {
    push-location
    Import-Module SqlPS -ErrorAction 'SilentlyContinue' 3>&1 | out-null
    pop-location
}

function Get-SqlFilepathOnTargetMachine
{
    param([string] $inlineSql)

    $tempFilePath = [System.IO.Path]::GetTempFileName()
    ($inlineSql | Out-File $tempFilePath)

    return $tempFilePath
}

function ExecuteSql
{
    param (
        [string]$taskType,
        [string]$sqlFile,
        [string]$inlineSql,
        [string]$serverName,
        [string]$databaseName,
        [string]$authscheme,
        [string]$sqlUsername,
        [string]$sqlPassword,
        [string]$additionalArguments
    )

    Write-Verbose "Entering script SqlQueryOnTargetMachines.ps1"
    try 
    {
        if($taskType -eq "sqlInline")
        {
            # Convert this inline Sql to a temporary file on Server
            $sqlFile = Get-SqlFilepathOnTargetMachine $inlineSql
        }
        else
        {
            # Validate Sql File
            if([System.IO.Path]::GetExtension($sqlFile) -ne ".sql")
            {
                throw "Invalid Sql file [ $sqlFile ] provided"
            }
        }        

        # Import SQLPS Module
        Import-SqlPs

        $scriptArgument = "Invoke-Sqlcmd -ServerInstance `"$serverName`" -Database `"$databaseName`" -InputFile `"$sqlFile`" "
        $scriptArgument += $additionalArguments

        $commandToRun = $scriptArgument
        $commandToLog = $scriptArgument

        if($authscheme -eq "sqlServerAuthentication")
        {
            $commandToRun += " -Username `"$sqlUsername`" -Password `"$sqlPassword`" "
            $commandToLog += " -Username `"$sqlUsername`" -Password ****** "
        }

        Write-Verbose "Executing : $commandToLog"
        Invoke-Expression $commandToRun

    } # End of Try
    Finally
    {
        # Cleanup the temp file & dont error out in case Deletion fails
        if ($taskType -eq "sqlInline" -and $sqlFile -and ((Test-Path $sqlFile) -eq $true))
        {
            Write-Verbose "Removing File $sqlFile"
            Remove-Item $sqlFile -ErrorAction 'SilentlyContinue'
        }
    }
}