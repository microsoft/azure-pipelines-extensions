import tl = require("vsts-task-lib/task");

export class AnsibleParameters {
    public ansibleInterface: string;
    public sshEndpoint: string;
    public username: string;
    public password: string;
    public hostname: string;
    public port: string;
    public cliRunOptions: string;
    public commands: string[];
    public scriptFile: string;
    public scriptArgs: string;
    public failOnStdErr: boolean;
    public jobTemplateName: string;

    constructor() {
        try {
            this.ansibleInterface = tl.getInput('ansibleInterface', true);
            if (this.ansibleInterface == 'cli') {
                this.sshEndpoint = tl.getInput('connectionOverSsh', true);
                this.username = tl.getEndpointAuthorizationParameter(this.sshEndpoint, 'username', false);
                this.password = tl.getEndpointAuthorizationParameter(this.sshEndpoint, 'password', true);
                this.hostname = tl.getEndpointDataParameter(this.sshEndpoint, 'host', false);
                this.port = tl.getEndpointDataParameter(this.sshEndpoint, 'port', true);
                this.cliRunOptions = tl.getInput('cliRunOptions', true);
                this.commands = tl.getDelimitedInput('commands', '\n');
                this.scriptFile = tl.getPathInput('scriptPath');
                this.scriptArgs = tl.getInput('args');
                this.failOnStdErr = tl.getBoolInput('failOnStdErr');
            } else {
                var connectedService = tl.getInput("connectionAnsibleTower", true);
                var endpointAuth = tl.getEndpointAuthorization(connectedService, true);
                this.username = endpointAuth.parameters["username"];
                this.password = endpointAuth.parameters["password"];
                this.hostname = tl.getEndpointUrl(connectedService, true);
                this.jobTemplateName = tl.getInput("jobTemplateName");
            }
        } catch (error) {
            throw new Error(tl.loc("Ansible_ConstructorFailed", error.message));
        }
    }
}