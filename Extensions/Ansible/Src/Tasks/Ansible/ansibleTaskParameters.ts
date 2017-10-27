import tl = require("vsts-task-lib/task");

export class ansibleTaskParameters {
    
    constructor () {
        this.initializeAnsibleParameters();
    }
    public static getInstance(): ansibleTaskParameters {
        if(ansibleTaskParameters._taskParameters == null) { 
            ansibleTaskParameters._taskParameters = new ansibleTaskParameters();
        }
        return ansibleTaskParameters._taskParameters;
    }
    private initializeAnsibleParameters() {
        this.ansibleInterface = tl.getInput('ansibleInterface', true);
        if(this.ansibleInterface == 'remoteMachine') {
            this.sshEndpoint = tl.getInput('connectionOverSsh', true);
            
            this.playbookSource = tl.getInput('playbookSourceRemoteMachine', true);
            if(this.playbookSource == 'agentMachine') {
                this.playbookRoot = tl.getInput('playbookRootRemoteMachine', true);
                this.playbookPath = tl.getInput('playbookPathLinkedArtifactOnRemoteMachine', true);
            } else if(this.playbookSource == 'ansibleMachine') {
                this.playbookPath = tl.getInput('playbookPathAnsibleMachineOnRemoteMachine', true);
            }
            
            this.inventoryType = tl.getInput('inventoriesRemoteMachine', true);
            if(this.inventoryType == "file") {
                this.inventoryFileSource = tl.getInput('inventoryFileSourceRemoteMachine', true);
                if(this.inventoryFileSource == 'agentMachine') {
                    this.inventoryFilePath = tl.getInput('inventoryFileLinkedArtifactOnRemoteMachine', true);
                } else if(this.inventoryFileSource == 'ansibleMachine') {
                    this.inventoryFilePath = tl.getInput('inventoryFileAnsibleMachineOnRemoteMachine', true);
                }
            } else if(this.inventoryType == 'hostList') {
                this.inventoryHostList = tl.getInput('inventoryHostListRemoteMachine', true);
            } else if(this.inventoryType == 'inlineContent') {
                this.inventoryDynamic = tl.getBoolInput('inventoryInlineDynamicRemoteMachine', false);
                this.inventoryInline = tl.getInput('inventoryInlineContentRemoteMachine', true);
            }
        } else if(this.ansibleInterface == 'agentMachine') {
            this.playbookPath = tl.getInput('playbookPathOnAgentMachine', true);
            
            this.inventoryType = tl.getInput('inventoriesAgentMachine', true);
            if(this.inventoryType == "file") {
                this.inventoryFilePath = tl.getInput('inventoryFileOnAgentMachine', true);
            } else if(this.inventoryType == 'hostList') {
                this.inventoryHostList = tl.getInput('inventoryHostListAgentMachine', true);
            } else if(this.inventoryType == 'inlineContent') {
                this.inventoryDynamic = tl.getBoolInput('inventoryInlineDynamicAgentMachine', false);
                this.inventoryInline = tl.getInput('inventoryInlineContentAgentMachine', true);
            }
        }

        this.sudoEnable = tl.getBoolInput('sudoEnabled', false);
        if(this.sudoEnable) {
            this.sudoUser = tl.getInput('sudoUser', false);
        }
        this.additionalParams = tl.getInput('args', false);
        this.failOnStdErr = tl.getBoolInput('failOnStdErr', false);
    }

    public ansibleInterface: string;
    public sshEndpoint: string;
    public playbookSource: string;
    public playbookRoot: string;
    public playbookPath: string;
    public inventoryType: string;
    public inventoryFileSource: string;
    public inventoryFilePath: string;
    public inventoryHostList: string;
    public inventoryDynamic: boolean;
    public inventoryInline: string;
    public sudoEnable: boolean;
    public sudoUser: string;
    public additionalParams: string;
    public failOnStdErr: boolean;

    private static _taskParameters: ansibleTaskParameters = null;
}