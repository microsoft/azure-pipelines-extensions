# Authentication schemes
Authentication scheme in a service endpoint determines the credentials that would be used to connect to the external service. In order to populate task drop downs, TFS/VSTS connects to the external service using the credentials provided as part of the endpoint. TFS/VSTS effectively becomes a client of the external service querying for details pertaining to the task input.

Following are the authentication schemes that can be utilized by a custom service endpoint type :
- [Oauth2](#oauth2)
- [Basic Authentication](#basic)
- [Token Based Authentication](#token)
- [Certificate based authentication](#certificate)
- [JSON web token based OAUTH authentication](#noauth)
- [No authentication](#jwt)

### <a name="oauth2"></a> Oauth2
To use this authentication scheme you will need to override following 2 fields in your endpoint contribution :
- `authorizationUrl` : Provides the url from which authorization token can be fetched. This url will be opened up in a popup dialog for the user to sign-in into the corresponding service.
- `AccessToken` data source binding : Provides datasource binding which can be used to fetch access token.

```
    {
      "id": "endpoint-auth-scheme-oauth2",
      "description": "OAuth2 endpoint authentication scheme using OAuth Configuration.",
      "type": "ms.vss-endpoint.service-endpoint-auth-scheme",
      "targets": [ "ms.vss-endpoint.endpoint-auth-schemes" ],
      "properties": {
        "name": "OAuth2",
        "displayName": "i18n:OAuth2",
        "authorizationUrl": "",
        "dataSourceBindings": [
          {
            "target": "AccessToken",
            "endpointUrl" :  "", 
            "requestVerb": "",
            "requestContent": "",
            "resultSelector": "",
            "resultTemplate": ""
          }
        ],
        "inputDescriptors": [
          {
            "id": "ConfigurationId",
            "name": "Configuration Id",
            "description": "Configuration Id for connecting to the endpoint",
            "inputMode": "combo",
            "isConfidential": false,
            "validation": { "dataType": "guid" },
            "hasDynamicValueInformation": true
          }
        ]
      }
    }
```    
<b> `Redirect Url` </b> : Used by OAuth supported endpoints to share the tokens with VSTS. Here's the callback url in TFS that should be used for redirection.
- TFS : http://yourhostname:8080/tfs/DefaultCollection/_admin/oauth2/callback
- Hosted (VSTS) : https://youraccount.visualstudio.com/_admin/oauth2/callback

E.g below is how `oauth2` authentication scheme is used in *Github Enterprise* endpoint :
```
{
    "displayName": "i18n:OAuth2",
    "type": "ms.vss-endpoint.endpoint-auth-scheme-oauth2",
    "authorizationUrl": "{{{configuration.Url}}}/login/oauth/authorize?client_id={{{configuration.ClientId}}}&scope=repo,user,admin:repo_hook",
    "dataSourceBindings": [
        {
            "target": "AccessToken",
            "endpointUrl": "{{{configuration.Url}}}/login/oauth/access_token",
            "requestVerb": "Post",
            "requestContent": "{\"client_id\":\"{{{configuration.ClientId}}}\",\"client_secret\":\"{{{configuration.ClientSecret}}}\",\"code\":\"{{{configuration.AuthorizationCode}}}\"}",
            "resultSelector": "jsonpath:$",
            "resultTemplate": "{\"AccessToken\" : \"{{{access_token}}}\", \"Error\" : \"{{{error}}}\", \"ErrorDescription\" : \"{{{error_description}}}\"}"
        }
    ]
}
```
### <a name="basic"></a> Basic authentication
This scheme takes 2 inputs – Username & Password (confidential). 

Default auth. header used is : ```Basic {{ #base64 endpoint.username \":\" endpoint.password }}```

```
"id": "endpoint-auth-scheme-basic",
"description": "Basic Authentication based endpoint authentication scheme",
"type": "ms.vss-endpoint.service-endpoint-auth-scheme",
"targets": [
    "ms.vss-endpoint.endpoint-auth-schemes"
],
"properties": {
    "name": "UsernamePassword",
    "displayName": "i18n:Basic Authentication",
    "headers": [
        {
            "name": "Authorization",
            "value": "Basic {{ #base64 endpoint.username \":\" endpoint.password }}"
        }
    ],
    "inputDescriptors": [
        {
            "id": "username",
            "name": "i18n:Username",
            "description": "i18n:Username for connecting to the endpoint",
            "inputMode": "textbox",
            "isConfidential": false,
            "validation": {
                "isRequired": true,
                "dataType": "string",
                "maxLength": 300
            }
        },
        {
            "id": "password",
            "name": "i18n:Password",
            "description": "i18n:Password for connecting to the endpoint",
            "inputMode": "passwordbox",
            "isConfidential": true,
            "validation": {
                "isRequired": true,
                "dataType": "string",
                "maxLength": 300
            }
        }
    ]
}
```

### <a name="token"></a> Token based authentication
This scheme takes 1 input – API Token (confidential)

Default auth header used is: ```{{endpoint.apitoken}}```

```
"id": "endpoint-auth-scheme-token",
"description": "i18n:Token based endpoint authentication scheme",
"type": "ms.vss-endpoint.service-endpoint-auth-scheme",
"targets": [
    "ms.vss-endpoint.endpoint-auth-schemes"
],
"properties": {
    "name": "Token",
    "displayName": "i18n:Token Based Authentication",
    "headers": [
        {
            "name": "Authorization",
            "value": "{{endpoint.apitoken}}"
        }
    ],
    "inputDescriptors": [
        {
            "id": "apitoken",
            "name": "i18n:API Token",
            "description": "i18n:API Token for connection to endpoint",
            "inputMode": "textbox",
            "isConfidential": true,
            "validation": {
                "isRequired": true,
                "dataType": "string",
                "maxLength": 300
            }
        }
    ]
}
```

### <a name="certificate"></a> Certificate based authentication

This scheme takes 1 input – Certificate (confidential)

The value of certificate has to be provided in the text area.

```
"id": "endpoint-auth-scheme-cert",
"description": "i18n:Creates a certificate-based endpoint authentication scheme",
"type": "ms.vss-endpoint.service-endpoint-auth-scheme",
"targets": [
    "ms.vss-endpoint.endpoint-auth-schemes"
],
"properties": {
    "name": "Certificate",
    "displayName": "i18n:Certificate Based",
    "inputDescriptors": [
        {
            "id": "certificate",
            "name": "i18n:Certificate",
            "description": "Content of the certificate",
            "inputMode": "TextArea",
            "isConfidential": true,
            "validation": {
                "isRequired": true,
                "dataType": "string"
            }
        }
    ]
}
```

### <a name="noauth"></a> No authentication
This scheme is used when an endpoint type does not require to take any input. For e.g. external services that support anonymous access to its resources.

```
"id": "endpoint-auth-scheme-none",
"description": "i18n:Creates an endpoint authentication scheme with no authentication.",
"type": "ms.vss-endpoint.service-endpoint-auth-scheme",
"targets": [
    "ms.vss-endpoint.endpoint-auth-schemes"
],
"properties": {
    "name": "None",
    "displayName": "i18n:No Authentication"
}
```

### <a name="jwt"></a> JSON web token based OAUTH authentication

This authentication scheme takes 4 inputs – Issuer, Audience, Scope, PrivateKey.

The following processing is done in order to generate auth. header for this authentication scheme:
- Create JSON web token using the issuer, audience & scope provided. Scope is added as additional claim in the token.
- PrivateKey is used to populate the signature in the token. It is expected to be in PEM format.
- POST call is made to the audience with the generated token as content & the response of the call is taken as the bearer’s access token in the auth. header as '`Bearer <access_token>`'


```
"id": "endpoint-auth-scheme-JWT",
"description": "i18n:Endpoint authentication scheme to support OAUTH using JSON Web token",
"type": "ms.vss-endpoint.service-endpoint-auth-scheme",
"targets": [
    "ms.vss-endpoint.endpoint-auth-schemes"
],
"properties": {
    "name": "JWT",
    "displayName": "i18n:JSON Web Token based authentication",
    "inputDescriptors": [
        {
            "id": "Issuer",
            "name": "i18n:Issuer",
            "description": "i18n:Issuer for creating JWT",
            "inputMode": "textbox",
            "isConfidential": false,
            "validation": {
                "isRequired": false,
                "dataType": "string",
                "maxLength": 300
            }
        },
        {
            "id": "Audience",
            "name": "i18n:Audience",
            "description": "i18n:Audience for creating JWT",
            "inputMode": "textbox",
            "isConfidential": false,
            "validation": {
                "isRequired": true,
                "dataType": "string",
                "maxLength": 300
            }
        },
        {
            "id": "Scope",
            "name": "i18n:Scope",
            "description": "i18n:Scope to be provided",
            "inputMode": "textbox",
            "isConfidential": false,
            "validation": {
                "isRequired": false,
                "dataType": "string",
                "maxLength": 300
            }
        },
        {
            "id": "PrivateKey",
            "name": "i18n:Private Key",
            "description": "i18n:Private Key for connecting to the endpoint",
            "inputMode": "textbox",
            "isConfidential": true,
            "validation": {
                "isRequired": true,
                "dataType": "string",
                "maxLength": 2000
            }
        }
    ]
}
```
