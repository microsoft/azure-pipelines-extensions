import { BaseTerraformCommandHandler } from './base-terraform-command-handler';
import { TerraformCommandHandlerAzureRM } from './azure-terraform-command-handler';
import { TerraformCommandHandlerAWS } from './aws-terraform-command-handler';
import { TerraformCommandHandlerGCP } from './gcp-terraform-command-handler';

export interface IParentCommandHandler {
    execute(providerName: string, command: string): Promise<number>;
}

export class ParentCommandHandler implements IParentCommandHandler {
    public async execute(providerName: string, command: string): Promise<number> {
        // Create corresponding command handler according to provider name
        let provider: BaseTerraformCommandHandler;

        switch(providerName) {
            case "azurerm":
                provider = new TerraformCommandHandlerAzureRM();
                break;
            
            case "aws":
                provider = new TerraformCommandHandlerAWS();
                break;
            
            case "gcp":
                provider = new TerraformCommandHandlerGCP();
                break;
        }

        // Run the corrresponding command according to command name
        return await provider[command]();
    }
}