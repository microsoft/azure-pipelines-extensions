import * as TFBackend from "./backend/backends"
import * as TFProvider from "./provider/providers"
import { TFBackendS3 } from "./backend/s3";
import { TFBackendGCS } from "./backend/gcs";

export class ParentCommandHandler {
    public async execute(backendType: string, providerType: string, command: string): Promise<number> {

        let provider: TFProvider.Base;
        let backend: TFBackend.Base;

        // TODO: INTRODUCE BACKEND in addition to PROVIDER
        switch(providerType) {
            case "azurerm": provider = new TFProvider.AzureRM(); break;
            case "aws": provider = new TFProvider.AWS(); break;
            case "google": provider = new TFProvider.Google(); break;
            default: throw new Error("Invalid provider specified. Please select AzureRM, AWS or Google.")
        }

        switch(backendType) {
            case "local": backend = new TFBackend.Local(); break;
            case "remote": backend = new TFBackend.Remote(); break;
            case "azurerm": backend = new TFBackend.AzureRM(); break;
            case "s3": backend = new TFBackendS3(); break;
            case "gcs": backend = new TFBackendGCS(); break;
            default: throw new Error("Invalid backend specified. Please select Local, Remote, AzureRM, S3 or GCS.")
        }

        // Run the corrresponding command according to command name
        return await provider[command]();
    }
}