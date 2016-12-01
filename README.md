# Release and Deployment extensions (VS Team Services)

This repository is a common place for all the extensions that RM team publishes through **Microsoft** and **Microsoft DevLabs** publishers.

## Extensions
### IIS web deploy
Extension that lets you deploy web application to IIS. [More info](Extensions/IISWebAppDeploy/Src/README.md)

## How to Build 

Ensure you have installed Node.js. Clone the repository, and go to the root folder of the repository and run the following commands. 

- `npm install` will install all the node modules required to run gulp to package, build etc.
- `gulp build`  will copy each task to "_build" folder, and install it's dependencies locally (wrt to the task) and copies the common modules required to run the task.
- `gulp test` will run all pester or mocha tests written for each task, in the Tests folder. 

## How to package extensions

You'll have to run `gulp build` and `gulp test` before you start packaging.

- `gulp package` will package all the extensions and stores them in "_package" folder.
- `gulp package --publisher=<publisher_name>` will package all the extensions under a new publisher name that you specify in "_package" folder.
- `gulp package --extension=<extension_name>` will package the single extension you mention, and stores it in "_package" folder.   
