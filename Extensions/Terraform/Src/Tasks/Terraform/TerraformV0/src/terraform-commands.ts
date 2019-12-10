export class TerraformBaseCommandInitializer {
    public readonly name: string;
    public readonly workingDirectory: string;
    public readonly additionalArgs: string | undefined;

    constructor(
        name: string,
        workingDirectory: string,
        additionalArgs?: string | undefined
    ) {
        this.name = name;
        this.workingDirectory = workingDirectory;
        this.additionalArgs = additionalArgs;
    }
}

export class TerraformAuthorizationCommandInitializer extends TerraformBaseCommandInitializer {
    readonly serviceProviderName: string;

    constructor(
        name: string,
        workingDirectory: string,
        serviceProviderName: string,
        additionalArgs?: string | undefined
    ) {
        super(name, workingDirectory, additionalArgs);
        this.serviceProviderName = serviceProviderName;
    }
}