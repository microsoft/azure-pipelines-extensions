# Twitter Sentiment Analysis Extension

This extension includes a release gate to calculate average sentiment of tweets made for a hashtag. The gate is useful to ensure that there is positivity in tweets made for the application updated on an environment before promoting the release to the next environment. 

It uses [Text Analytics API](https://azure.microsoft.com/en-in/services/cognitive-services/text-analytics) from Azure Cognitive Services for sentiment analysis of the tweets.

## Prerequisites

### Create Azure Function

The gate uses an [Azure function](https://azure.microsoft.com/en-us/services/functions) for a server less on-demand processing of tweets received for a hashtag. [Create](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-azure-function) an HTTP triggered function and use this [sample code](https://github.com/Microsoft/vsts-rm-extensions/blob/master/Extensions/TwitterSentimentAnalysis/Src/TwitterSentimentAnalysisAzureFunction.txt) in the Azure function.

### Obtain Consumer key and secret for Twitter

If you don't have twitter application, create [Twitter application](https://apps.twitter.com/) for using Twitter REST APIs. Once you create a twitter application, get the 'Consumer Key' and 'Consumer Secret' from 'Keys and Access Tokens' tab. 

### Obtain Azure Cognitive Services access key

[Text Analytics API](https://azure.microsoft.com/en-in/services/cognitive-services/text-analytics) from Azure Cognitive Services is used in the [sample azure function](https://github.com/Microsoft/vsts-rm-extensions/blob/master/Extensions/TwitterSentimentAnalysis/Src/TwitterSentimentAnalysisAzureFunction.txt) for sentiment analysis of the tweets. Cognitive service access key is required to use Text Analytics APIs. Follow this [guide](https://docs.microsoft.com/en-in/azure/cognitive-services/text-analytics/how-tos/text-analytics-how-to-access-key) to obtain a cognitive service access key. 

## Gate

Installing the extension adds the following 'Get Twitter Sentiment' gate and agentless task.

### Gate snapshot:

 ![Gate snapshot](Images/TwitterSentimentGate.png)

### Input parameters
 
 The gate required the following inputs:
 
 - **Twitter consumer key**:  Specify Twitter application consumer key. To keep the value secure, define a secret variable and use it here. If you don't have twitter application, create [Twitter application](https://apps.twitter.com/) and get the 'Consumer Key' from 'Keys and Access Tokens' tab.

 - **Twitter consumer secret**:  Specify Twitter application consumer secret value. To keep the value secure, define a secret variable and use it here. If you don't have twitter application, create [Twitter application](https://apps.twitter.com/) and get the 'Consumer Secret' from 'Keys and Access Tokens' tab.
 
 - **Hashtag to analyze**: Analyze sentiment of tweets made with this Hashtag like #ReleaseManagement.

 - **Azure function url**:  Url of the Azure function that needs to be invoked​. Example:- https://azurefunctionapp.azurewebsites.net/api/HttpTriggerCS1.
 
 - **Azure function key**:  Function or Host key with which we can access this function. To keep the key secure, define a secret variable and use it here. Example: - $(myFunctionKey) where myFunctionKey is an environment level secret variable with value as the secret key like ZxPXnIEODXLRzYwCw1TgZ4osMfoKs9Zn6se6X/N0FnztfDvZbdOmYw==.
 
 - **Cognitive services access key**:  Specify access key for Text Analytics API. To keep the key secure, define a secret variable and use it here. Follow this [guide](https://docs.microsoft.com/en-in/azure/cognitive-services/text-analytics/how-tos/text-analytics-how-to-access-key) to obtain a cognitive service access key.

 - **Cognitive services endpoint region**:  Specify the region corresponding to the Text Analytics API endpoint.

 - **Analyze tweets since**:  Analyze the tweets made after this time. By default, uses $(Release.Deployment.StartTime) and analyzes the tweets made after start of the deployment. Date and time should be in UTC and format should be yyyy-MM-ddTHH:mm:ssZ. eg. 2018-01-31T07:56:59Z

 - **Threshold**: Threshold value for average sentiment of the tweets analyzed. If the average sentiment score is less than the threshold, task will fail. Default value is 0.5. Threshold should be between 0 and 1.

## Contact Information
You can use [RM Extensions on Github](https://github.com/Microsoft/vsts-rm-extensions/issues) to report any issues.