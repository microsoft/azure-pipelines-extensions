var os = require('os');

export class AnsibleInterface {
    constructor() {
    }
    public execute(): void {
        throw "selected interface not supported";
    }
    protected _writeLine(str) : void {
        this._outStream.write(str + os.EOL);
    }

    private _outStream = process.stdout;
}

