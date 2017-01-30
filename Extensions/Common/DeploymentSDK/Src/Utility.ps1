function convertTo-JsonFormat($InputObject) {
    if (Get-Command ConvertTo-Json -ErrorAction SilentlyContinue)
    {
        $jsonOutput = ConvertTo-Json -InputObject $InputObject
    } 
    else
    {
        try
        {
            add-type -assembly system.web.extensions
            $scriptSerializer = new-object system.web.script.serialization.javascriptSerializer
            $jsonOutput = $scriptSerializer.Serialize($InputObject)
        }
        catch
        {
            Write-Verbose $_.Exception
            $errorMessage = "Unable to convert json string to object. Please install WMF 4.0 and try again."
            if($_.Exception.Message)
            {
                $errorMessage = [string]::Format("{0} {1} {2}", $errorMessage, [Environment]::NewLine, $_.Exception.Message)
            }
            throw $errorMessage
        }
    }
    return $jsonOutput
}

function convertFrom-JsonFormat($InputObject) {
    if (Get-Command ConvertTo-Json -ErrorAction SilentlyContinue)
    {
        $convertedObject = ConvertFrom-Json -InputObject $InputObject
    } 
    else
    {
        try
        {
            add-type -assembly system.web.extensions
            $scriptSerializer = new-object system.web.script.serialization.javascriptSerializer
            $convertedObject = ,$scriptSerializer.DeserializeObject($InputObject)
        }
        catch
        {
            Write-Verbose $_.Exception
            $errorMessage = "Unable to convert json string to object. Please install WMF 4.0 and try again."
            if($_.Exception.Message)
            {
                $errorMessage = [string]::Format("{0} {1} {2}", $errorMessage, [Environment]::NewLine, $_.Exception.Message)
            }
            throw $errorMessage
        }
        
    }
    return $convertedObject
}
