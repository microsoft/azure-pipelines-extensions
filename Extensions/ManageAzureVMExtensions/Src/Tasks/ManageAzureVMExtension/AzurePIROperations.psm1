. $PSScriptRoot/Constants.ps1

function Check-ExtensionExistsInAzurePIR {
    param([string][Parameter(Mandatory = $true)]$subscriptionId,
        [System.Security.Cryptography.X509Certificates.X509Certificate2][Parameter(Mandatory = $true)]$certificate,
        [string][Parameter(Mandatory = $true)]$publisher,
        [string][Parameter(Mandatory = $true)]$type)

    $uri = "https://management.core.windows.net/$subscriptionId/services/publisherextensions"
    Write-Host ("$uri`: {0}" -f $uri)
    # invoke GET rest api to check whether the extension already exists
    try {
        $publisherExtensions = Invoke-RestMethod -Method GET -Uri $uri -Certificate $certificate -Headers @{'x-ms-version' = $azureClassicApiVersion}
        $checkExtension = $publisherExtensions.ExtensionImages.ExtensionImage | Where-Object {($_.ProviderNameSpace -eq $publisher) -and ($_.Type -eq $type)}
    }
    catch {
        throw (Get-VstsLocString -Key "VMExtPIR_FetchExtentionFromPIRError" -ArgumentList $_)
    }
    return ($checkExtension -ne $null)
}

function Create-ExtensionPackageInAzurePIR {
    param([xml][Parameter(Mandatory = $true)]$extensionDefinitionXml,
        [System.Security.Cryptography.X509Certificates.X509Certificate2][Parameter(Mandatory = $true)]$certificate,
        [string][Parameter(Mandatory = $true)]$subscriptionId)

    $uri = "https://management.core.windows.net/$subscriptionId/services/extensions"
    Write-Host ("$uri`: {0}" -f $uri)
    try {
        # invoke POST rest api to create the extension
        Invoke-RestMethod -Method POST -Uri $uri -Certificate $certificate -Headers @{'x-ms-version' = $azureClassicApiVersion} -Body $extensionDefinitionXml.OuterXml -ContentType application/xml
        Write-Host (Get-VstsLocString -Key "VMExtPIR_ExtensionPublishSuccess" -ArgumentList $extensionDefinitionXml.ExtensionImage.Type, $extensionDefinitionXml.ExtensionImage.Version)
    }
    catch {
        throw (Get-VstsLocString -Key "VMExtPIR_ExtensionCreationError" -ArgumentList $_)
    }
}

function Delete-ExtensionPackageFromAzurePIR {
    param([string][Parameter(Mandatory = $true)]$extensionName,
        [string][Parameter(Mandatory = $true)]$publisher,
        [string][Parameter(Mandatory = $true)]$versionToDelete,
        [System.Security.Cryptography.X509Certificates.X509Certificate2][Parameter(Mandatory = $true)]$certificate,
        [string][Parameter(Mandatory = $true)]$subscriptionId)

    if ($versionToDelete -eq "NOTHING_TO_DELETE") {
        Write-Host (Get-VstsLocString -Key "VMExtPIR_NothingToDelete")
        return
    }

    Write-Host (Get-VstsLocString -Key "VMExtPIR_DeletingExtensionVersion" -ArgumentList $versionToDelete)

    # First set extension as internal and then delete
    [xml]$definitionXml = [xml]('<?xml version="1.0" encoding="utf-8"?>
  <ExtensionImage xmlns="http://schemas.microsoft.com/windowsazure" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">   
  <ProviderNameSpace></ProviderNameSpace>
  <Type></Type>
  <Version></Version>
  <IsInternalExtension>true</IsInternalExtension>
  <IsJsonExtension>true</IsJsonExtension>
  </ExtensionImage>')

    $definitionXml.ExtensionImage.ProviderNameSpace = [string]$publisher
    $definitionXml.ExtensionImage.Type = [string]$extensionName
    $definitionXml.ExtensionImage.Version = [string]$versionToDelete
    $($definitionXml.ExtensionImage.version)

    $putUri = "https://management.core.windows.net/$subscriptionId/services/extensions?action=update"
    Write-Host (Get-VstsLocString -Key "VMExtPIR_MarkingExtensionInternal" -ArgumentList $putUri)

    Invoke-WithRetry -retryCommand {Invoke-RestMethod -Method PUT -Uri $putUri -Certificate $certificate -Headers @{'x-ms-version' = $azureClassicApiVersion} -Body $definitionXml -ContentType application/xml -ErrorAction SilentlyContinue} -expectedErrorMessage "Conflict"

    Start-Sleep -Seconds 10

    # now delete
    $uri = "https://management.core.windows.net/$subscriptionId/services/extensions/$publisher/$extensionName/$versionToDelete"
    Write-Host (Get-VstsLocString -Key "VMExtPIR_DeletingExtension" -ArgumentList $uri)

    Invoke-WithRetry -retryCommand {Invoke-RestMethod -Method DELETE -Uri $uri -Certificate $certificate -Headers @{'x-ms-version' = $azureClassicApiVersion} -ErrorAction SilentlyContinue} -expectedErrorMessage "Conflict"
    Write-Host (Get-VstsLocString -Key "VMExtPIR_ExtensionDeleteSuccess" -ArgumentList $extensionDefinitionXml.ExtensionImage.Type, $extensionDefinitionXml.ExtensionImage.Version)
}

function Update-ExtensionPackageInAzurePIR {
    param([xml][Parameter(Mandatory = $true)]$extensionDefinitionXml,
        [System.Security.Cryptography.X509Certificates.X509Certificate2][Parameter(Mandatory = $true)]$certificate,
        [string][Parameter(Mandatory = $true)]$subscriptionId)

    Write-Host (Get-VstsLocString -Key "VMExtPIR_UpdatingExtensionVersion" -ArgumentList $($extensionDefinitionXml.ExtensionImage.Version))

    $uri = "https://management.core.windows.net/$subscriptionId/services/extensions?action=update"
    Write-Host ("$uri`: {0}" -f $uri)

    # invoke PUT rest api to update the extension

    Invoke-WithRetry -retryCommand {Invoke-RestMethod -Method PUT -Uri $uri -Certificate $certificate -Headers @{'x-ms-version' = $azureClassicApiVersion} -Body $extensionDefinitionXml.OuterXml -ContentType application/xml -ErrorAction SilentlyContinue} -expectedErrorMessage "Conflict"
    Write-Host (Get-VstsLocString -Key "VMExtPIR_ExtensionPublishSuccess" -ArgumentList $extensionDefinitionXml.ExtensionImage.Type, $extensionDefinitionXml.ExtensionImage.Version)
}

#
# Exports
#
Export-ModuleMember `
    -Function `
        Check-ExtensionExistsInAzurePIR, `
        Create-ExtensionPackageInAzurePIR, `
        Delete-ExtensionPackageFromAzurePIR, `
        Update-ExtensionPackageInAzurePIR