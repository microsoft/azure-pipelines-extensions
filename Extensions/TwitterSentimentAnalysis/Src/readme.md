# **Twitter sentiment analysis extension**

This extension includes a build/release task and a release gate to calculate average sentiment of tweets made for a hashtag. The gate is useful to ensure that there is positivity in tweets made for the application updated on an environment before promoting the release to the next environment.

It uses [Text Analytics API](https://azure.microsoft.com/en-in/services/cognitive-services/text-analytics) from Azure Cognitive Services for sentiment analysis of the tweets.
## **Prerequisites**

### **Create Azure Function**

The task uses an [Azure function](https://azure.microsoft.com/en-us/services/functions) for a server less on-demand processing of tweets received for a hashtag. [Create](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-azure-function) an HTTP triggered function and use this [sample code](TwitterSentimentAnalysisAzureFunction.txt) in the Azure function.

### **Obtain Consumer key and secret for Twitter**

If you don't have twitter application, [create Twitter](https://apps.twitter.com/) application for using Twitter REST APIs. Once you create a twitter application, get the 'Consumer Key' and 'Consumer Secret' from 'Keys and Access Tokens' tab. 

### **Obtain Azure Cognitive Services access key**

[Text Analytics API](https://azure.microsoft.com/en-in/services/cognitive-services/text-analytics) from Azure Cognitive Services is used in the [sample azure function](TwitterSentimentAnalysisAzureFunction.txt) for sentiment analysis of the tweets. Cognitive service access key is required to use Text Analytics APIs. Follow this [guide](https://docs.microsoft.com/en-in/azure/cognitive-services/text-analytics/how-tos/text-analytics-how-to-access-key) to obtain a cognitive service access key. 

## **Task**

Installing the extension adds the following 'Get Twitter Sentiment' gate and agentless task.

Task snapshot:
 ![Task snapshot](Images/TaskInputs.png)

 ## **Task Input parameters**
 
 The task required the following inputs:
 
 * **Azure Function Url**:  Url of the Azure function that needs to be invoked​. Example:- https://azurefunctionapp.azurewebsites.net/api/HttpTriggerCS1.
 
 * **Function Key**:  Function or Host key with which we can access this function. To keep the key secure, define a secret variable and use it here. Example: - $(myFunctionKey) where myFunctionKey is an environment level secret variable with value as the secret key like ZxPXnIEODXLRzYwCw1TgZ4osMfoKs9Zn6se6X/N0FnztfDvZbdOmYw==.

 * **Hashtag To Analyze**: Analyze sentiment of tweets made with this Hashtag like #vsts.

 * **Consumer Key**:  Specify Twitter application consumer key. To keep the value secure, define a secret variable and use it here. Refer [Obtain Consumer key and secret for Twitter](#user-content-**obtain-consumer-key-and-secret-for-twitter**).

 * **Consumer Secret**:  Specify Twitter application consumer secret value. To keep the value secure, define a secret variable and use it here. Refer [Obtain Consumer key and secret for Twitter](#user-content-**obtain-consumer-key-and-secret-for-twitter**).

 * **Cognitive Services Access Key**:  Specify access key for Text Analytics API. To keep the key secure, define a secret variable and use it here. Refer [Obtain Azure Cognitive Services access key](#user-content-**obtain-azure-cognitive-services-access-key**)

 * **Cognitive Services Endpoint Region**:  Specify the region corresponding to the Text Analytics API endpoint. For example, Region is 'westus' for cognitive service endpoint https://westus.api.conginitve.microsoft.com/text/analytics/v2.0.

 * **Analyze Tweets Since**:  Analyze the tweets made after this time. By default, uses $(Release.Deployment.StartTime) and analyzes the tweets made after start of the deployment.

 * **Threshold**: Threshold value for average sentiment of the tweets analyzed. If the average sentiment score is less than the threshold, task will fail. Default value is 0.5.

### **Contact Information**
You can use [RM Extensions on Github](https://github.com/Microsoft/vsts-rm-extensions/issues) to report any issues.