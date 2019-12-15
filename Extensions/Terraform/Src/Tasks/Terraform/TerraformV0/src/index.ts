import tl = require('azure-pipelines-task-lib/task');
import path = require('path');

import * as TFBackend from "./backend/backends"
import * as TFProvider from "./provider/providers"
import { TFBackendS3 } from "./backend/s3";
import { TFBackendGCS } from "./backend/gcs";
import { Terraform } from "./terraform";

async function run() {
    tl.setResourcePath(path.join(__dirname, '..', 'task.json'));

    // try { tl.setResult(tl.TaskResult.Succeeded, ""); }
    // catch (error) { tl.setResult(tl.TaskResult.Failed, error.message); }

    let provider: TFProvider.Base;
    let backend: TFBackend.Base;
    
    switch(tl.getInput("provider", true)) {
        case "azurerm": provider = new TFProvider.AzureRM(); break;
        case "aws": provider = new TFProvider.AWS(); break;
        case "google": provider = new TFProvider.Google(); break;
        default: throw new Error("Invalid provider specified. Please select AzureRM, AWS or Google.")
    }

    switch(tl.getInput("backend", true)) {
        case "local": backend = new TFBackend.Local(); break;
        case "remote": backend = new TFBackend.Remote(); break;
        case "azurerm": backend = new TFBackend.AzureRM(); break;
        case "s3": backend = new TFBackendS3(); break;
        case "gcs": backend = new TFBackendGCS(); break;
        default: throw new Error("Invalid backend specified. Please select Local, Remote, AzureRM, S3 or GCS.")
    }

    // Run the corrresponding command according to command name
    let terraform: Terraform = new Terraform(backend, provider);
    return await terraform[tl.getInput("command", true)]();
}

run();