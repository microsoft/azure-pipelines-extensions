# Customizing service endpoints

## Overview

Basic goal for customizing service endpoint is to allow extensibility of endpoint type. This extensibility serves the following purposes:
- [Choosing appropriate authentication scheme(s)](#authenticationschemes) for the endpoint type.
- [Inputs/URL for the endpoint type can be customized](#customizinginputs) to help user when creating endpoint.
- [Custom icon for the endpoint type](#typeicon) can be provided to help differentiate the type among various other types.
- [Tasks can refer to appropriate endpoint type](datasources.md#endpointId) and help user in selecting endpoint relevant to the task.
- [Custom authorization headers](#authenticationheader) can be specified when using the endpoint from TFS/VSTS to query the external service.
- [Data sources](datasources.md) can be specified within the endpoint type so that any task can refer to it in order to populate drop downs.

To create a custom endpoint type contribution and refer it within a custom task check [Service Endpoints in VSTS](https://docs.microsoft.com/en-us/vsts/extend/develop/service-endpoints?view=vsts)

## <a name="authenticationschemes"></a> Choosing authentication scheme(s)

Authentication scheme in a service endpoint determines the credentials that would be used to connect to the external service. In order to populate task drop downs, TFS/VSTS connects to the external service using the credentials provided as part of the endpoint. TFS/VSTS effectively becomes a client of the external service querying for details pertaining to the task input.

TFS/VSTS supports a closed set of authentication schemes that can be utilized by a custom service endpoint type. 

### Supported authentication schemes :
| Authentication Scheme | Type Name |
| :------------- |:-------------|
| Oauth2 | `ms.vss-endpoint.endpoint-auth-scheme-oauth2` |
| Basic Authentication | `ms.vss-endpoint.endpoint-auth-scheme-basic` |
| Token Based Authentication | `ms.vss-endpoint.endpoint-auth-scheme-token` |
| Certificate based authentication | `ms.vss-endpoint.endpoint-auth-scheme-cert` |
| JSON web token based OAUTH authentication | `ms.vss-endpoint.endpoint-auth-scheme-JWT` |
| No authentication | `ms.vss-endpoint.endpoint-auth-scheme-none` |

E.g. [External TFS endpoint type](https://github.com/Microsoft/vsts-rm-extensions/blob/master/Extensions/ExternalTfs/Src/vss-extension.json#L206) specifies the following authentication schemes:

```
"authenticationSchemes": [
    {
        "type": "ms.vss-endpoint.endpoint-auth-scheme-basic"
    },
    {
        "type": "ms.vss-endpoint.endpoint-auth-scheme-token"
    }
]
```

** Refer [authentication schemes](authenticationSchemes.md) for more details about the authentication schemes.

## <a name="customizinginputs"></a> Customizing inputs

Following are some of the customizations that are supported for endpoint inputs :
- [Supplying Additional inputs](#additionalinputs)
- [Specifying Input Types](#inputtypes)
- [Hiding authentication parameters](#hidingauthparameters)
- [Overriding authentication parameters](#overrideauthparameters)
- [Supplying help text for input](#inputhelptext)
- [Customizing URL](#customizeurl)

### <a name="additionalinputs"></a> Additional inputs

Endpoint type can include inputs in addition to name, URL and the auth. parameters. 

For e.g. Azure Classic endpoint type includes subscription ID and subscription name inputs:
```
{
    "id": "subscriptionId",
    "name": "i18n:Subscription Id",
    "description": "i18n:Subscription Id from the <a href=\"https://go.microsoft.com/fwlink/?LinkID=312990\" target=\"_blank\">publish settings file</a>",
    "inputMode": "textbox",
    "isConfidential": false,
    "validation": {
        "isRequired": true,
        "dataType": "guid",
        "maxLength": 38
    }
},
{
    "id": "subscriptionName",
    "name": "i18n:Subscription Name",
    "description": "i18n:Subscription Name from the <a href=\"https://go.microsoft.com/fwlink/?LinkID=312990\" target=\"_blank\">publish settings file</a>",
    "inputMode": "textbox",
    "isConfidential": false,
    "validation": {
        "isRequired": true,
        "dataType": "string",
        "maxLength": 255
    }
}
```

### <a name="inputtypes"></a> Specifying input types

Text box, Text area, Combo inputs are supported.

When specifying combo input, the set of possible values & default value can be provided. For e.g. *Azure Classic* endpoint uses environment combo input:

```
{
    "id": "environment",
    "name": "i18n:Environment",
    "description": "i18n:Windows Azure Environment for the subscription",
    "inputMode": "combo",
    "isConfidential": false,
    "validation": {
        "isRequired": false,
        "dataType": "string",
        "maxLength": 300
    },
    "values": {
        "inputId": "environmentValues",
        "defaultValue": "AzureCloud",
        "possibleValues": [
            {
                "value": "AzureCloud",
                "displayValue": "Azure Cloud"
            },
            {
                "value": "AzureChinaCloud",
                "displayValue": "Azure China Cloud"
            },
            {
                "value": "AzureUSGovernment",
                "displayValue": "Azure US Government"
            },
            {
                "value": "AzureGermanCloud",
                "displayValue": "Azure German Cloud"
            }
        ]
    }
}
```

### <a name="hidingauthparameters"></a> Hiding authentication parameters

Authentication parameter input can be hidden if required. For e.g. *HockeyApp* endpoint type hides user name field although it uses basic authentication scheme.

```
{
    "id": "username",
    "name": "Username",
    "description": "Username",
    "inputMode": "textbox",
    "isConfidential": false,
    "validation": {
        "isRequired": false,
        "dataType": "string"
    },
    "values": {
        "inputId": "usernameInput",
        "defaultValue": "",
        "isDisabled": true
    }
}
```
 
### <a name="overrideauthparameters"></a> Overriding auth. parameter input field name

Input field name of the auth. parameter input can be overridden if required. For e.g. Chef endpoint overrides the input field names for basic auth. scheme:

```
"authenticationSchemes": [
    {
        "type": "ms.vss-endpoint.endpoint-auth-scheme-basic",
        "inputDescriptors": [
            {
                "id": "username",
                "name": "i18n:Node Name (Username)",
                "description": "i18n:Chef username",
                "_description.comment": "Don't Localize the word 'Chef'",
                "inputMode": "textbox",
                "isConfidential": false,
                "validation": {
                    "isRequired": true,
                    "dataType": "string"
                }
            },
            {
                "id": "password",
                "name": "i18n:Client Key",
                "description": "i18n:Client key specified in the .pem file",
                "inputMode": "textarea",
                "isConfidential": false,
                "validation": {
                    "isRequired": true,
                    "dataType": "string"
                }
            }
        ]
    }
```

### <a name="inputhelptext"></a> Supplying help text for input

Help text can be provided for inputs & they can include hyperlinks as well. For e.g. subscription name input of Azure Classic endpoint type has customized help:

```
{
    "id": "subscriptionName",
    "name": "i18n:Subscription Name",
    "description": "i18n:Subscription Name from the <a href=\"https://go.microsoft.com/fwlink/?LinkID=312990\" target=\"_blank\">publish settings file</a>",
    "inputMode": "textbox",
    "isConfidential": false,
    "validation": {
        "isRequired": true,
        "dataType": "string",
        "maxLength": 255
    }
}
```

### <a name="customizeurl"></a> Customizing URL

Endpoint url supports following customizations :
- [Default value](#defaultvalue)
- [Hiding url](#hidingurl)
- [Help text](#helptext)
- [Dependency on another input](#dependency)

#### <a name="defaultvalue"></a> Default value for URL

URL is a mandatory field to be provided when creating a service endpoint. In some cases, it would be redundant/unnecessary to expect user to provide value for URL. For e.g. URL for Azure Classic endpoint when using Azure public cloud would always be https://management.core.windows.net/. In such cases, the endpoint type can define it as default value.

```
"url": {
    "displayName": "i18n:Server Url",
    "value": "https://management.core.windows.net/",
    "isVisible": "true",
}
```

#### <a name="hidingurl"></a> Hiding URL field

In cases where there is no requirement for user to override default value of URL provided in the endpoint type, the URL field can be completely hidden. This can be achieved by defining “isVisible” property of the Url as “false”.

 

NOTE: To support backward compatibility, if isVisible property is not specified, it is assumed to be false & the URL is hidden. For e.g. HockeyApp endpoint type hides the URL value when creating service endpoint:

```
"url": "https://rink.hockeyapp.net/api/2/apps/"
```

 
#### <a name="helptext"></a> Help text for URL

Help text can be provided for inputs & they can include hyperlinks as well. For e.g. Azure service fabric endpoint type defines help for the URL:

```
"url": {
"displayName": "i18n:Cluster Endpoint",
"required": true,
"helpText": "i18n:Client connection endpoint for the cluster. Prefix the value with &quot;https://&quot;."
}
```

#### <a name="dependency"></a> Dependency on another input                  

URL can be dependent on value of another input field in the endpoint type. As and when the value of the input changes, URL value will also get updated in the endpoint creation UI. For e.g. Azure Classic endpoint type’s URL depends on “environment” input. A map of the “environment” to “URL” values is defined in the endpoint type & based on this, the value of URL gets populated:

```
"url": {
    "displayName": "i18n:Server Url",
    "value": "https://management.core.windows.net/",
    "isVisible": "true",
    "helpText": "",
    "dependsOn": {
        "input": "environment",
        "map": [
            {
                "key": "AzureCloud",
                "value": "https://management.core.windows.net/"
            },
            {
                "key": "AzureChinaCloud",
                "value": "https://management.core.chinacloudapi.cn/"
            },
            {
                "key": "AzureUSGovernment",
                "value": "https://management.core.usgovcloudapi.net/"
            },
            {
                "key": "AzureGermanCloud",
                "value": "https://management.core.cloudapi.de/ "
            }
        ]
    }
```

### <a name="helptext"></a> Customizing help text for the endpoint type

Help text including help links can be specified for the endpoint type that appears in the bottom of the create/update endpoint UI

For e.g. *Azure Classic* endpoint type provides custom help :

```
{
    "id": "azure-endpoint-type",
    "properties": {
        "name": "azure",
        "helpMarkDown": "i18n:For certificate: download <a href=\"https://go.microsoft.com/fwlink/?LinkID=312990\" target=\"_blank\"><b>publish settings file</b></a>. For Service Principal: refer to <a href=\"https://go.microsoft.com/fwlink/?LinkID=623000\" target=\"_blank\"><b>link</b></a>. <a href=\"https://msdn.microsoft.com/Library/vs/alm/Release/author-release-definition/understanding-tasks#serviceconnections\" target=\"_blank\"><b>Learn More</b></a>",
    }
}
```
 
### <a name="typeicon"></a> Customizing endpoint type icon

Endpoint type will use the icon of the extension that it is part of by default. For e.g. HockeyApp endpoint type uses the extension’s icon:

```
"icons": {
    "default": "images/hockeyapp-logo.png",
    "large": "images/hockeyapp-logo-large.png"
}
```

If required, an `icon` specific to the endpoint type can be defined & this will override the extension’s icon when displayed. For e.g. *Azure* extension supports an icon but *Azure Service Fabric* endpoint overrides the icon :

```
"icons": {
    "default": "icons/vss_default.png",
    "wide": "icons/vss_wide.png"
},
"files": [
    {
        "path": "icons/azure-service-fabric-icon.png",
        "addressable": true
    },
    {
        "path": "icons/azure-endpoint-icon.png",
        "addressable": true
    }
],
{
    "id": "servicefabric-endpoint-type",
    "properties": {
        "name": "servicefabric",
        "icon": "icons/azure-service-fabric-icon.png"
    }
}
```

### <a name="authenticationheader"></a> Customizing authentication header

Different external services expect the auth. scheme parameters to be passed differently in the HTTP requests. For TFS/VSTS to be able to communicate with the external service to query values to populate in task input drop downs, auth. header has to be constructed as per how the external service expects.

Auth. header to specify in the HTTP request can be customized when defining the endpoint type contribution. For e.g. Bitbucket endpoint type specifies the following custom auth. header:

```
"authenticationSchemes": [
    {
        "type": "ms.vss-endpoint.endpoint-auth-scheme-token",
        "headers": [
            {
                "name": "Authorization",
                "value": "Basic {{ #base64 endpoint.username \":\" endpoint.apitoken }}"
            }
        ]
    }
]
```

Mustache evaluation is supported when constructing the auth. header.

`#base64` is a supported Mustache handler that computes Base64 encoded value of the `username:apitoken` combination. [Here's](https://github.com/Microsoft/vsts-rm-extensions/blob/master/docs/authoring/endpoints/mustacheHelpers.md) the list of currently supported mustache helpers.

Auth. parameters in the endpoint can be referred in the expression using `endpoint.*` notation & these get resolved with the values in the endpoint used in the task when evaluating the expression.
