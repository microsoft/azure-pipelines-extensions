import {TerraformToolHandler, ITerraformToolHandler} from './terraform';
import {ToolRunner, IExecOptions, IExecSyncOptions} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformBaseCommandInitializer, TerraformAuthorizationCommandInitializer} from './terraform-commands';
import tasks = require('azure-pipelines-task-lib/task');

export interface ITerraformCommandHandler {
    providerName: string;
    terraformToolHandler: ITerraformToolHandler;
    backendConfig: Map<string, string>;

    init(): Promise<number>;
    plan(): Promise<number>;
    apply(): Promise<number>;
    destroy(): Promise<number>;
    validate(): Promise<number>;
}

export abstract class BaseTerraformCommandHandler implements ITerraformCommandHandler {
    providerName: string;
    terraformToolHandler: ITerraformToolHandler;
    backendConfig: Map<string, string>;
    
    constructor() {
        this.providerName = "";
        this.terraformToolHandler = new TerraformToolHandler(tasks);
        this.backendConfig = new Map<string, string>();
    }

    protected warnIfMultipleProviders(): void {
        let terraformPath;
        try {
            terraformPath = tasks.which("terraform", true);
        } catch(err) {
            throw new Error(tasks.loc("TerraformToolNotFound"));
        }

        let terraformToolRunner: ToolRunner = tasks.tool(terraformPath);
        terraformToolRunner.arg("providers");
        let commandOutput = terraformToolRunner.execSync(<IExecSyncOptions>{
            cwd: tasks.getInput("workingDirectory")
        });

        let countProviders = (commandOutput.stdout.match(/provider/g) || []).length;
        tasks.debug(countProviders.toString());
        if (countProviders > 1) {
            tasks.warning("Multiple provider blocks specified in the .tf files in the current working drectory.");
        }
    }

    protected getServiceProviderNameFromProviderInput(): string {
        let provider: string = tasks.getInput("provider", true);
        
        switch (provider) {
            case "azurerm": return "AzureRM";
            case "aws"    : return "AWS";
            case "gcp"    : return "GCP";
        }
    }

    abstract handleBackend(terraformToolRunner: ToolRunner);

    public async init(): Promise<number> {
        let initCommand = new TerraformBaseCommandInitializer(
            "init",
            tasks.getInput("workingDirectory"),
            tasks.getInput("commandOptions")
        );
        
        let terraformTool;
        try {
            terraformTool = this.terraformToolHandler.createToolRunner(initCommand);
            this.handleBackend(terraformTool);
        } catch (err) {
            throw err;
        }
        
        return terraformTool.exec(<IExecOptions> {
            cwd: initCommand.workingDirectory
        });
    }

    public async plan(): Promise<number> {
        this.warnIfMultipleProviders();
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let planCommand = new TerraformAuthorizationCommandInitializer(
            "plan",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            tasks.getInput("commandOptions")
        );
        
        let terraformTool;
        try {
            terraformTool = this.terraformToolHandler.createToolRunner(planCommand);
            this.handleProvider(planCommand);
        } catch (err) {
            throw err;
        }

        return terraformTool.exec(<IExecOptions> {
            cwd: planCommand.workingDirectory
        });
    }

    public async apply(): Promise<number> {
        this.warnIfMultipleProviders();
        try {
            await this.validate();
        } catch (err) {
            throw err;
        }
        
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let autoApprove: string = '-auto-approve';
        let additionalArgs: string = tasks.getInput("commandOptions") || autoApprove;

        if (additionalArgs.includes(autoApprove) === false) {
            additionalArgs = `${autoApprove} ${additionalArgs}`;
        }

        let applyCommand = new TerraformAuthorizationCommandInitializer(
            "apply",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            additionalArgs
        );

        let terraformTool;
        try {
            terraformTool = this.terraformToolHandler.createToolRunner(applyCommand);
            this.handleProvider(applyCommand);
        } catch (err) {
            throw err;
        }

        return terraformTool.exec(<IExecOptions> {
            cwd: applyCommand.workingDirectory
        });
    };

    public async destroy(): Promise<number> {
        this.warnIfMultipleProviders();
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let autoApprove: string = '-auto-approve';
        let additionalArgs: string = tasks.getInput("commandOptions") || autoApprove;

        if (additionalArgs.includes(autoApprove) === false) {
            additionalArgs = `${autoApprove} ${additionalArgs}`;
        }

        let destroyCommand = new TerraformAuthorizationCommandInitializer(
            "destroy",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            additionalArgs
        );

        let terraformTool;
        try {
            terraformTool = this.terraformToolHandler.createToolRunner(destroyCommand);
            this.handleProvider(destroyCommand);
        } catch (err) {
            throw err ;
        }

        return terraformTool.exec(<IExecOptions> {
            cwd: destroyCommand.workingDirectory
        });
    };

    abstract handleProvider(command: TerraformAuthorizationCommandInitializer);

    public async validate(): Promise<number> {
        let validateCommand = new TerraformBaseCommandInitializer(
            "validate",
            tasks.getInput("workingDirectory"),
            tasks.getInput("commandOptions")
        );

        let terraformTool;
        try {
            terraformTool = this.terraformToolHandler.createToolRunner(validateCommand);
        } catch (err) {
            throw err;
        }

        return terraformTool.exec(<IExecOptions>{
            cwd: validateCommand.workingDirectory
        });
    }
}