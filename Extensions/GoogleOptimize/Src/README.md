# Google Optimize
Optimize allows you to test variants of web pages and see how they perform against an objective that you specify. Optimize monitors the results of your experiment and tells you which variant is the leader. To get started:
 
 
 
1) [ Set up Optmize](https://support.google.com/optimize/answer/6211921)
2) [ Deploy the optimize snippet on your website](https://support.google.com/optimize/answer/6211921)
3) [ Create your first experiment](https://support.google.com/optimize/answer/6211930)
 
 
 
# Overview
Google Optimize extension for azure devops lets you start , stop and update your experiments in minimal steps. This extension provides you two ways of making changes - 
 
* by entering changes into provided fields in task.
* by adding a json file with proper [schema](Tasks/GoogleOptimize/models/Schema.json)



## Manage experiments with Azure Pipelines 
Start , pause or stop an experiment, assign traffic coverage and set traffic distribution method using the task in Azure Pipelines.

* Search for Google Optimize and click on "Add"

![](images/1.JPG)

* Now you need to configure the connection to your "Google" account. Click on "+ New" button on the "Google Optimize service connection" field on the right pane
* In the new connection dialog, enter a name for the connection and other four field related to your google account. In order to get all other fields follow the below steps -
    * Visit https://console.developers.google.com/ and register your app as new application with google. 
    * Select the Google Analytics Api from Library.
    * Create service account key and obtain json credentials.
    * Add the client email from json file as a user in google analytics User Management and provide necessary access.
    
![](images/2.JPG)

* Choose proper account Id , Web Property Id and profile Id from drop down menus.
* Select which experiment to update.
* Select suitable action from the drop down menu.
* Next enter all the variation you want to make in the above selected experiment either from a configuration file or by using below provided input boxes. 

NOTE- In case of conflict between config file and textbox inputs, inputs provided in textbox will override the data provided in config file.

A sample for config file
```json
 
{
   "id":"uk4SC_5ASfO0HyPwP-jWEQ",
   "objectiveMetric":"ga:pageviews",
   "winnerConfidenceLevel":0.95,
   "minimumExperimentLengthInDays":32,
}
```
For more info on config file please visit [here](https://developers.google.com/analytics/devguides/config/mgmt/v3/mgmtReference/management/experiments)





