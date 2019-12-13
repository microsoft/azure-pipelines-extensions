import { BaseTerraformCommandHandler } from './provider/base';
import { TerraformCommandHandlerAzureRM } from './provider/azurerm';
import { TerraformCommandHandlerAWS } from './provider/aws';
import { TerraformCommandHandlerGCP } from './provider/google';

export interface IParentCommandHandler {
    execute(providerName: string, command: string): Promise<number>;
}

export class ParentCommandHandler implements IParentCommandHandler {
    public async execute(providerName: string, command: string): Promise<number> {
        // Create corresponding command handler according to provider name
        let provider: BaseTerraformCommandHandler;


        // TODO: INTRODUCE BACKEND in addition to PROVIDER
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