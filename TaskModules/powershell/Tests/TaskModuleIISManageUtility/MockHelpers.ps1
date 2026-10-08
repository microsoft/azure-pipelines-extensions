## Helper for global mock functions 

Register-Mock Get-AppCmdLocation { 
    return "appcmdPath", 8
}

function Get-MockCredentials {
    param([Parameter(Mandatory = $true)][string]$PasswordPrefix)

    $username = "domain\name"
    $password = $PasswordPrefix + '!`"$password'

    $securePass = New-Object System.Security.SecureString
    ForEach ($ch in $password.ToCharArray()) { $securePass.appendChar($ch) }
    $authCredentials = New-Object System.Management.Automation.PSCredential($username, $securePass)
    return $authCredentials
}