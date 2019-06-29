export class BaseTerraformCommand {
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

export class TerraformInit extends BaseTerraformCommand {
    readonly backendType: string | undefined;

    constructor(
        name: string,
        workingDirectory: string,
        backendType: string,
        additionalArgs?: string | undefined
    ) {
        super(name, workingDirectory, additionalArgs);
        if (backendType) {
            this.backendType = backendType;
        }
    }
}

export class TerraformPlan extends BaseTerraformCommand {
    readonly serviceProvidername: string;

    constructor(
        name: string,
        workingDirectory: string,
        serviceProvidername: string,
        additionalArgs?: string | undefined
    ) {
        super(name, workingDirectory, additionalArgs);
        this.serviceProvidername = serviceProvidername;
    }
}

export class TerraformApply extends BaseTerraformCommand {
    readonly serviceProvidername: string;

    constructor(
        name: string,
        workingDirectory: string,
        serviceProvidername: string,
        additionalArgs?: string | undefined
    ) {
        super(name, workingDirectory, additionalArgs);
        this.serviceProvidername = serviceProvidername;
    }
}

export class TerraformDestroy extends BaseTerraformCommand {
    readonly serviceProvidername: string;

    constructor(
        name: string,
        workingDirectory: string,
        serviceProvidername: string,
        additionalArgs?: string | undefined
    ) {
        super(name, workingDirectory, additionalArgs);
        this.serviceProvidername = serviceProvidername;
    }
}
