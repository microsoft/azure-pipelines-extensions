# **Twitter sentiment analysis extension**

This extension includes a build/release task to integrate with [Azure Function](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-azure-function). The task executes given azure funtion with task inputs and return sentiment analysis for given hash tag. With this extension, you can use this task to get twitter sentiment for a given hash tag.

## **Prerequisites**

### **Create Azure Function**
Follow the [installation guidance](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-azure-function) and create an HTTP triggered function. Copy paste this [sample code](TwitterSentimentAnalysisAzureFunction.txt) in azure function.

### **Create Twitter Application**
If you don't have twitter application, create [Twitter application](https://apps.twitter.com/) for using Twitter REST APIs. Once you create twitter application, go to 'Keys and Access Tokens' tab and get Consumer Key and Consumer Secret. You need to provide this Consumer Key and Consumer Secret in task inputs.

### **Get Azure Congnitive Services Access key**
Azure Congnitive Service [Text Analytics API](https://azure.microsoft.com/en-in/services/cognitive-services/text-analytics) used in this [sample azure function](TwitterSentimentAnalysisAzureFunction.txt). Congnitive service access key is required to use Text Analytics APIs. This [document](https://docs.microsoft.com/en-in/azure/cognitive-services/text-analytics/how-tos/text-analytics-how-to-access-key) gives information on how to find congnitive service access key. You need to provide this access key in 'Cognitive Subscription Key' task input.

## **Task** 
Installing the extension adds the following 'Get Twitter Sentiment' task in server side tasks and gates:

Task snapshot:
 ![Task snapshot](Images/TaskInputs.png)

 ## **Task arguments** 
 
 * **Azure Function Url**:  Url of the Azure function that needs to be invoked​. Example:- https://azurefunctionapp.azurewebsites.net/api/HttpTriggerJS1.
 
 * **Function Key**:  Function or Host key with which we can access this function. To keep the key secure, define a secret variable and use it here. Example: - $(myFunctionKey) where myFunctionKey is an environment level secret variable with value as the secret key like ZxPXnIEODXLRzYwCw1TgZ4osMfoKs9Zn6se6X/N0FnztfDvZbdOmYw==.

 * **HashTag For Analysis**: Provide Twitter Hash Tag which you want get sentiment score. ex:- #vsts.

 * **Consumer Key**:  Specify Twitter application consumer key.

 * **Consumer Secret**:  Specify Twitter application consumer secret value.

 * **Cognitive Subscription Key**:  Specify Cognitive service access key.

 * **Cognitive Service Region**:  Specify congnitive service region where above access key belongs. Ex:- Region is 'westus' for conginitve service endpoint https://westus.api.conginitve.microsoft.com/text/analytics/v2.0.

 * **Read tweets since**:  Read tweets from this give date. Default $(Release.Deployment.StartTime), reads the tweets from starting time of deployment.

 * **Threshold**: Threshold value of sentiment. If sentiment score for give hash tag is less than threshold task will fail. Default value is 0.5.
