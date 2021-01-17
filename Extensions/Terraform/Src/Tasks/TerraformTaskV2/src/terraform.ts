import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner'
import { TerraformBaseCommandInitializer } from './terraform-commands'

export interface ITerraformToolHandler {
    createToolRunner(command?: TerraformBaseCommandInitializer): ToolRunner;
}

export class TerraformToolHandler implements ITerraformToolHandler {
    private readonly tasks: any;
    
    constructor(tasks: any) {
        this.tasks = tasks;
    }

    public createToolRunner(command?: TerraformBaseCommandInitializer): ToolRunner {
        let terraformPath;
        try {
            terraformPath = this.tasks.which("terraform", true);
        } catch(err) {
            throw new Error(this.tasks.loc("TerraformToolNotFound"));
        }
        
        let terraformToolRunner: ToolRunner = this.tasks.tool(terraformPath);
        if (command) {
            terraformToolRunner.arg(command.name);
            if (command.additionalArgs) {
                terraformToolRunner.line(command.additionalArgs);
            }
        }

        return terraformToolRunner;
    }
}
