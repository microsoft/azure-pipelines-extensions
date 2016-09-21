# Release and Deployment extensions (VS Team Services)

This repository is a common place for all the extensions that RM team publishes through **Microsoft** and **Microsoft DevLabs** publishers.

## Extensions
### IIS web deploy
Extension that lets you deploy web application to IIS. [More info](Extensions/IISWebAppDeploy/Src/README.md)

## How to Build 

Ensure you have installed the node.js

    - npm install
    - gulp build
    - gulp test

## How to package extensions

You'll have to run `gulp build` and `gulp test` before you start packaging.

    - "gulp package" will package all the extensions and stores them in "_package" folder.
    - "gulp package --publisher=<publisher_name>" will package all the extensions under a new publisher name that you specify in "_package" folder.
    - "gulp package --extension=<extension_name>" will package the single extension you mention, and stores it in "_package" folder.   
