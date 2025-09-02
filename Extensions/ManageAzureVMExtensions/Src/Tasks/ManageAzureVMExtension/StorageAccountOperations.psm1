. $PSScriptRoot/Constants.ps1

function Ensure-ContainerExists {
    param([string][Parameter(Mandatory = $true)]$storageAccountName,
        [string][Parameter(Mandatory = $true)]$containerName,
        [string][Parameter(Mandatory = $true)]$storageAccountKey)

    $method = "GET"
    $headerDate = $azureStorageApiVersion
    $headers = @{"x-ms-version" = "$headerDate"}
    $queryParameterString = "restype=container"
    $url = "https://${storageAccountName}.blob.core.windows.net/${containerName}" + "?" + $queryParameterString
    $xmsdate = Get-UTCDateTimeNow
    $headers.Add("x-ms-date", $xmsdate)
    $resourceComponents = @($storageAccountName, $containerName)
    $signature = Get-SharedKeySignature -method $method -headers $headers -resourceComponents $resourceComponents -queryParameterString $queryParameterString -storageAccountKey $storageAccountKey
    $headers.Add("Authorization", "SharedKey " + $storageAccountName + ":" + $signature)
    try {
        Invoke-RestMethod -Uri $url -Method $method -headers $headers
    }
    catch {
        if ($_.ErrorDetails.Message.Contains("ContainerNotFound")) {
            Create-NewContainer -storageAccountName $storageAccountName -containerName $containerName -storageAccountKey $storageAccountKey
        }
        else {
            throw (Get-VstsLocString -Key "VMExtPIR_ContainerDetailsFetchError" -ArgumentList $_)
        }
    }
}

function Ensure-StorageAccountExists {
    param([string][Parameter(Mandatory = $true)]$subscriptionId,
        [string][Parameter(Mandatory = $true)]$storageAccountName,
        [System.Security.Cryptography.X509Certificates.X509Certificate2][Parameter(Mandatory = $true)]$certificate)
    
    try {
        $uri = "https://management.core.windows.net/$subscriptionId/services/storageservices/$storageAccountName"
        $result = Invoke-RestMethod -Method GET -Uri $uri -Certificate $certificate -Headers @{'x-ms-version' = $azureClassicApiVersion}
    }
    catch {
        if ($_.ErrorDetails.Message.Contains("ResourceNotFound")) {
            Create-ClassicStorageAccount -subscriptionId $subscriptionId -storageAccountName $storageAccountName -certificate $certificate
        }
        else {
            throw (Get-VstsLocString -Key "VMExtPIR_StorageDetailsFetchError" -ArgumentList $_)
        }

    }
}

function Get-PrimaryStorageAccountKey {
    param([string][Parameter(Mandatory = $true)]$subscriptionId,
        [string][Parameter(Mandatory = $true)]$storageAccountName,
        [System.Security.Cryptography.X509Certificates.X509Certificate2][Parameter(Mandatory = $true)]$certificate)
    
    try {
        $keysUri = "https://management.core.windows.net/$subscriptionId/services/storageservices/$storageAccountName/keys"
        $keysResult = Invoke-RestMethod -Method GET -Uri $keysUri -Certificate $certificate -Headers @{'x-ms-version' = $azureClassicApiVersion}
        return $keysResult.StorageService.StorageServiceKeys.Primary
    }
    catch {
        throw (Get-VstsLocString -Key "VMExtPIR_StorageAccountKeysFetchError" -ArgumentList $_)
    }
}

function Set-StorageBlobContent {
    param([string][Parameter(Mandatory = $true)]$storageAccountName,
        [string][Parameter(Mandatory = $true)]$containerName,
        [string][Parameter(Mandatory = $true)]$storageBlobName,
        [string][Parameter(Mandatory = $true)]$packagePath,
        [string][Parameter(Mandatory = $true)]$storageAccountKey)


    $method = "PUT"
    $headerDate = $azureStorageApiVersion
    $headers = @{"x-ms-version" = "$headerDate"}
    $url = "https://${storageAccountName}.blob.core.windows.net/${containerName}/${storageBlobName}"
    $xmsdate = Get-UTCDateTimeNow
    $content = [System.IO.File]::ReadAllBytes("$packagePath")
    $item = Get-Item "$packagePath"
    $length = $item.Length
    $headers.Add("x-ms-date", $xmsdate)
    $headers.Add("x-ms-blob-type", "BlockBlob")
    $headers.Add("Content-Type", "application/zip, application/octet-stream")
    $headers.Add("Content-Length", "$length")
    $resourceComponents = @($storageAccountName, $containerName, $storageBlobName)
    $signature = Get-SharedKeySignature -method $method -headers $headers -resourceComponents $resourceComponents -storageAccountKey $storageAccountKey
    $headers.Add("Authorization", "SharedKey " + $storageAccountName + ":" + $signature)
    try {
        Invoke-RestMethod -Uri $url -Method $method -headers $headers -Body $content
    }
    catch {
        throw (Get-VstsLocString -Key "VMExtPIR_BlobUploadError" -ArgumentList $_)
    }
}

function Create-ClassicStorageAccount {
    param([string][Parameter(Mandatory = $true)]$subscriptionId,
        [string][Parameter(Mandatory = $true)]$storageAccountName,
        [System.Security.Cryptography.X509Certificates.X509Certificate2][Parameter(Mandatory = $true)]$certificate)

    $uri = "https://management.core.windows.net/$subscriptionId/services/storageservices"
    $label = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($storageAccountName))
    $bodyxml = [xml]$ExecutionContext.InvokeCommand.ExpandString(('<?xml version="1.0" encoding="utf-8"?>
  <CreateStorageServiceInput xmlns="http://schemas.microsoft.com/windowsazure">
  <ServiceName>$storageAccountName</ServiceName>
  <Label>$label</Label>
  <Location>South Central US</Location>
  <ExtendedProperties>
    <ExtendedProperty>
      <Name>ResourceGroup</Name>
      <Value>$storageAccountName</Value>
    </ExtendedProperty>
    <ExtendedProperty>
      <Name>ResourceLocation</Name>
      <Value>southcentralus</Value>
    </ExtendedProperty>
  </ExtendedProperties>
  <AccountType>Standard_LRS</AccountType>
            </CreateStorageServiceInput>'))
    try {
        $response = Invoke-WebRequest -Method POST -Uri $uri -Certificate $certificate -Headers @{'x-ms-version' = $azureClassicApiVersion; "Content-Type" = "application/xml"} -Body $bodyxml.OuterXml -UseBasicParsing
        $operationStatusUri = "https://management.core.windows.net/$subscriptionId/operations/$($response.Headers['x-ms-request-id'])"
        $succeeded = $false
        for ($i = 0; $i -lt 20; $i++) {
            $operation = (Invoke-RestMethod -Method GET -Uri $operationStatusUri -Certificate $certificate -Headers @{'x-ms-version' = $azureClassicApiVersion}).Operation.Status
            if ($operation -eq "Succeeded") {
                $succeeded = $true
                break
            }
            elseif ($operation -eq "InProgress") {   
                Start-Sleep -s 10
                continue
            }
            else {
                throw (Get-VstsLocString -Key "VMExtPIR_CreateStorageAccountUnexpectedStatus" -ArgumentList $operation)
            }
        }
        if (-not($succeeded)) {
            throw (Get-VstsLocString -Key "VMExtPIR_CreateStorageAccountTimeout")
        }
    }
    catch {
        throw (Get-VstsLocString -Key "VMExtPIR_StorageAccountCreationError" -ArgumentList $_)
    }
}

function Create-NewContainer {
    param([string][Parameter(Mandatory = $true)]$storageAccountName,
        [string][Parameter(Mandatory = $true)]$containerName,
        [string][Parameter(Mandatory = $true)]$storageAccountKey)

    $method = "PUT"
    $headerDate = $azureStorageApiVersion
    $headers = @{"x-ms-version" = "$headerDate"}
    $queryParameterString = "restype=container"
    $url = "https://${storageAccountName}.blob.core.windows.net/${containerName}" + "?" + $queryParameterString
    $xmsdate = Get-UTCDateTimeNow
    $headers.Add("x-ms-date", $xmsdate)
    $headers.Add("x-ms-blob-public-access", "container")
    $resourceComponents = @($storageAccountName, $containerName)
    $signature = Get-SharedKeySignature -method $method -headers $headers -resourceComponents $resourceComponents -queryParameterString $queryParameterString -storageAccountKey $storageAccountKey
    $headers.Add("Authorization", "SharedKey " + $storageAccountName + ":" + $signature)
    try {
        Invoke-RestMethod -Uri $url -Method $method -headers $headers
    }
    catch {
        throw (Get-VstsLocString -Key "VMExtPIR_ContainerCreationError" -ArgumentList $_)
    }
}

function Get-SharedKeySignature {
    param([string][Parameter(Mandatory = $true)]$method,
        [hashtable][Parameter(Mandatory = $true)]$headers,
        [string[]][Parameter(Mandatory = $true)]$resourceComponents,
        [string][Parameter(Mandatory = $false)]$queryParameterString,
        [string][Parameter(Mandatory = $true)]$storageAccountKey)

    $signatureString = "{0}`n`n`n{1}`n`n{2}`n`n`n`n`n`n`n" -f $method.ToUpper(), $headers["Content-Length"], $headers["Content-Type"]
    # to do : do not replace whitespace in quoted strings in header value 
    # to do : lexicographic sorting of headers keys and query parameters
    # to do : url decode query parameters
    $headers.Keys | sort | % {if ($_.ToLower().StartsWith("x-ms-")) {$signatureString += "$($_.Trim(@("`t", " ", "`n"))):$($headers[$_] -replace "\s+", " ")`n"}}
    $resourceComponents | % {$signatureString += "/$_"}
    if($resourceComponents.Count -eq 1)
    {
        $signatureString += "/"
    }
    $queryParameters = @{}
    # to do : refine this
    if ($queryParameterString) {
        $queryParameterString.Split("&") | % {$qp = $($_.Split("=")); $queryParameters[$qp[0]] = $qp[1]}
    }
    $queryParameters.Keys | sort | % {$signatureString += "`n$($_):$($queryParameters[$_])"}
    $signatureStringBytes = [System.Text.Encoding]::UTF8.GetBytes($signatureString)
    $accountKeyBytes = [System.Convert]::FromBase64String($storageAccountKey)
    $hmac = new-object System.Security.Cryptography.HMACSHA256((, $accountKeyBytes))
    $signature = [System.Convert]::ToBase64String($hmac.ComputeHash($signatureStringBytes))
    return $signature
}

function Get-UTCDateTimeNow {
    return [DateTime]::UtcNow.ToString("R", [System.Globalization.CultureInfo]::InvariantCulture)
}

#
# Exports
#
Export-ModuleMember `
    -Function `
        Ensure-ContainerExists, `
        Ensure-StorageAccountExists, `
        Get-PrimaryStorageAccountKey, `
        Set-StorageBlobContent
