import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import { TFProvider } from './provider/base';
import { TFBackend } from './backend/base';
import { GenericHelpers } from './Helpers'
//import path = require('path');
//import * as uuidV4 from 'uuid/v4';
//const fs = require('fs');

export class Terraform {

    private toolRunner: tr.ToolRunner;
    private dir: string;
    private args: string | undefined;
    private provider: TFProvider;
    private backend: TFBackend;

    constructor(backend: TFBackend, provider: TFProvider) {
        this.provider = provider;
        this.backend = backend;
        this.dir = tl.getInput("workingDirectory");
        this.args = tl.getInput("commandOptions");

        this.toolRunner = Terraform.getToolRunner();
        if (this.provider) { this.provider.HandleProvider(); }
        if (this.backend) { this.backend.HandleBackend(this.toolRunner); }
    }

    private static getToolRunner(): tr.ToolRunner {
        let terraformPath: string;
        try { terraformPath = tl.which("terraform", true); }
        catch (err) { throw new Error(tl.loc("TerraformToolNotFound")); }
        return tl.tool(terraformPath);
    }

    private async command(name: string) {
        if (this.ProviderCount() > 1) { tl.warning("Multiple provider blocks specified in the .tf files in the current working drectory."); }
        this.toolRunner.arg(name);
        if (this.args) { this.toolRunner.line(this.args); }
        return this.toolRunner.exec(<tr.IExecOptions>{ cwd: this.dir });
    }


    private async onlyApply() { this.addAutoApproveArg(); return this.command("apply"); }
    private async onlyPlan() { return await this.command("plan"); }

    public async init() { return await this.command("init"); }
    public async validate() { return await this.command("validate"); }
    public async plan() { return await this.onlyPlan(); }
    public async apply() { return await this.onlyApply(); };
    public async destroy() { this.addAutoApproveArg(); return await this.command("destroy"); };

    private supportsJsonOutput(): boolean {
        let tool = Terraform.getToolRunner();
        tool.arg("version");

        let outputContents = tool.execSync(<tr.IExecSyncOptions>{ cwd: this.dir }).stdout;
        let outputLines: string[] = outputContents.split('\n');
        // First line has the format "Terraform v0.12.1"
        let firstLine = outputLines[0];
        // Extract only the version information from the first line i.e. "0.12.1"
        let currentVersion = firstLine.substring(11);
        // Check to see if this version is greater than or equal to 0.12.0
        return GenericHelpers.CompareSemVers(currentVersion, "0.12.0") >= 0 ? true : false;
    }

    private addAutoApproveArg() {
        let autoApprove: string = '-auto-approve';
        if (this.args.includes(autoApprove) === false) { this.args = `${autoApprove} ${this.args}`; }
    }

    private ProviderCount(): number {

        let tool = Terraform.getToolRunner();
        tool.arg("providers");
        let commandOutput = tool.execSync(<tr.IExecSyncOptions>{ cwd: this.dir });
        return (commandOutput.stdout.match(/provider/g) || []).length;
    }

    // // TODO: Fix this
    // public setOutputVariableToJsonOutputVariablesFilesPath() {
    //     this.command("output", `-json`);

    //     const jsonOutputVariablesFilePath = path.resolve(`output-${uuidV4()}.json`);
    //     const tempFileForJsonOutputVariables = path.resolve(`temp-output-${uuidV4()}.json`);
    //     const fileStream = fs.createWriteStream(tempFileForJsonOutputVariables);

    //     let commandOutput = this.toolRunner.execSync(<tr.IExecSyncOptions>{ cwd: this.dir, outStream: fileStream });

    //     tl.writeFile(jsonOutputVariablesFilePath, commandOutput.stdout);
    //     tl.setVariable('jsonOutputVariablesPath', jsonOutputVariablesFilePath);

    //     // Delete the temp file as it is not needed further
    //     if (tl.exist(tempFileForJsonOutputVariables)) {
    //         tl.rmRF(tempFileForJsonOutputVariables);
    //     }
    // }

    // // TODO: Fix this
    // public setOutputVariableToPlanFilePath() {
    //     if (this.supportsJsonOutput()) {

    //         // Do terraform plan with -out flag to output the binary plan file
    //         const binaryPlanFilePath = path.resolve(`plan-binary-${uuidV4()}.tfplan`);
    //         const tempFileForPlanOutput = path.resolve(`temp-plan-${uuidV4()}.txt`);

    //         this.command("plan", `${this.args} -out=${binaryPlanFilePath}`);
    //         let fileStream = fs.createWriteStream(tempFileForPlanOutput);
    //         this.toolRunner.execSync(<tr.IExecSyncOptions>{ cwd: this.dir, outStream: fileStream });

    //         // Do terraform show with -json flag to output the json plan file
    //         const jsonPlanFilePath = path.resolve(`plan-json-${uuidV4()}.json`);
    //         const tempFileForJsonPlanOutput = path.resolve(`temp-plan-json-${uuidV4()}.json`)
    //         let commandOutput: tr.IExecSyncResult;
    //         this.command("show", `-json ${binaryPlanFilePath}`);
    //         fileStream = fs.createWriteStream(tempFileForJsonPlanOutput);
    //         this.toolRunner.execSync(<tr.IExecSyncOptions>{ cwd: this.dir, outStream: fileStream });

    //         // Write command output to the json plan file
    //         tl.writeFile(jsonPlanFilePath, commandOutput.stdout);
    //         // Set the output variable to the json plan file path
    //         tl.setVariable('jsonPlanFilePath', jsonPlanFilePath);

    //         // Delete all the files that are not needed any further
    //         if (tl.exist(binaryPlanFilePath)) {
    //             tl.rmRF(binaryPlanFilePath);
    //         }

    //         if (tl.exist(tempFileForPlanOutput)) {
    //             tl.rmRF(tempFileForPlanOutput);
    //         }

    //         if (tl.exist(tempFileForJsonPlanOutput)) {
    //             tl.rmRF(tempFileForJsonPlanOutput);
    //         }

    //     } else {
    //         tl.warning("Terraform show command does not support -json flag for terraform versions older than 0.12.0. The output variable named 'jsonPlanFilePath' was not set.")
    //     }
    // }
}