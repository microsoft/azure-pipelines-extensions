export class Terraform {
    public readonly name: string;
    public readonly dir: string;
    public readonly args: string | undefined;

    constructor(
        name: string,
        dir: string,
        args?: string | undefined
    ) {
        this.name = name;
        this.dir = dir;
        this.args = args;
    }
}

export class TerraformCommand extends Terraform {
    readonly providerServiceName: string;

    constructor(
        name: string,
        dir: string,
        providerServiceName: string,
        args?: string | undefined
    ) {
        super(name, dir, args);
        this.providerServiceName = providerServiceName;
    }
}