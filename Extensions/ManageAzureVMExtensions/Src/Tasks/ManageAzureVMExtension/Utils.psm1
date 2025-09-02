function Invoke-WithRetry {
    param (
        [ScriptBlock] $retryCommand,
        [int] $retryInterval = 120,
        [int] $maxRetries = 60,
        [string] $expectedErrorMessage = ""
    )

    $retryCount = 0
    $isExecutedSuccessfully = $false

    do {
        try {
            $scriptOutput = & $retryCommand
            $isExecutedSuccessfully = $true
            return $scriptOutput
        }
        catch {
            Write-Host (Get-VstsLocString -Key "VMExtPIR_ExceptionDetails" -ArgumentList $($_.Exception.Response.StatusCode.ToString()), $_)
            if (($expectedErrorMessage -eq "") -or ($_.Exception.Response.StatusCode.ToString() -ne $expectedErrorMessage)) {
                throw (Get-VstsLocString -Key "VMExtPIR_NonConflictErrorFail" -ArgumentList $_)
            }
        }
    
        Write-Host (Get-VstsLocString -Key "VMExtPIR_ExecutionStats" -ArgumentList $isExecutedSuccessfully, $retryCount, $maxRetries, $retryInterval)
        $retryCount++
        Start-Sleep -s $retryInterval

    }
    While (($isExecutedSuccessfully -ne $true) -and ($retryCount -lt $maxRetries))

    if ($isExecutedSuccessfully -ne $true) {
        throw (Get-VstsLocString -Key "VMExtPIR_FailWithTimeout")
    }
}

function Get-TimeSinceEpoch {
    $epochTime = Get-Date "01/01/1970"
    $currentTime = Get-Date
    $timeSinceEpoch = (New-TimeSpan -Start $epochTime -End $currentTime).Ticks
    return $timeSinceEpoch
}

#
# Exports
#
Export-ModuleMember `
    -Function `
        Invoke-WithRetry, `
        Get-TimeSinceEpoch