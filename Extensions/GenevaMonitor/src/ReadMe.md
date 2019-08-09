# Geneva Monitor Extension

This extension includes a Geneva service endpoint and a Geneva query monitor health release gate. This allows for monitoring the health of a configured geneva monitor.

## Prerequisites

### Authenticating with Geneva

Follow the instructions for authenticating through a [self-signed certificate](https://genevamondocs.azurewebsites.net/collect/authentication/unmanaged.html) for access to Geneva monitoring account. Create the certificate and make sure to give it `ReadOnly` access on the monitoring account.

### Create a Geneva Server Endpoint

The endpoint will require following fields to create a Geneva connection:
- Geneva Monitoring Account: This is the account name which contains the monitor you want to query
- Geneva Account Home Stamp: This is the domain name on which the monitoring account is located. [Instructions](https://genevamondocs.azurewebsites.net/alerts/HowDoI/CheckTheStampNameForMyAccount.html?q=stamp) for locating the stamp name for account.
- Accept untrusted SSL certificates: Trust server certificate without installing on the agent machine. Check this if facing issues with trusting Geneva server connection.
- Client Certificate: Base64 encoded certificate which has read access on the specified account.
- Private Key: Base64 encoded private key corresponding to the certificate for authentication.
In case a `pfx` with private key is present, `openssl` can be used to get the certificate and private key. Use command `openssl pkcs12 -in yourpfxfile.pfx -out privatekey.pem -nodes`. Open the `pem` file generated using a text editor and copy the certificate and private key (**include** headers `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` when copying).

## ServerGate

![Monitoring Gate](images/serverGateMenu.png)

Installing the extension provides the `Query Monitor Health` gate. This gate can be configured to query the health status of one monitor for a given combination of metric dimensions.

### Task Arguments

- **Geneva server connection**: Geneva server endpoint.
- **Namespace**: Namespace in the monitoring account under which the monitor is defined.
- **Metric Name**: Metric name on which monitor runs.
- **Monitor Id**: Id of the monitor to be queried for health status.
- **Metric Dimensions**: The dimension values on which the monitor needs to be evaluated. This needs to be specified in the following format:    `{"dimension1":"value1","dimension2":"value2", ...}`. One way to know the dimensions and their required values is:
    - Go to `Health` tab on Jarvis portal
    - Locate the monitor under health tree.
    - Right click and select `View Details`

![Monitor view details](images/monitorViewDetails.png)

### Contact Information

For further information or to resolve issues, contact [Developer Community Forum](https://developercommunity.visualstudio.com/spaces/21/index.html).
