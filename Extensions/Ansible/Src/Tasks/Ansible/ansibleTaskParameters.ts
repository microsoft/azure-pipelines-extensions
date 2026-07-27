import tl = require("azure-pipelines-task-lib/task");

export class ansibleTaskParameters {
    constructor() {
        this.initializeAnsibleParameters();
    }

    public static getInstance(): ansibleTaskParameters {
        if (ansibleTaskParameters._taskParameters == null) {
            ansibleTaskParameters._taskParameters = new ansibleTaskParameters();
        }

        return ansibleTaskParameters._taskParameters;
    }

    private initializeAnsibleParameters() {
        this.ansibleInterface = tl.getInputRequired('ansibleInterface');

        if (this.ansibleInterface == 'remoteMachine') {
            this.sshEndpoint = tl.getInputRequired('connectionOverSsh');

            this.playbookSource = tl.getInputRequired('playbookSourceRemoteMachine');

            if (this.playbookSource == 'agentMachine') {
                this.playbookRoot = tl.getInputRequired('playbookRootRemoteMachine');
                this.playbookPath = tl.getInputRequired('playbookPathLinkedArtifactOnRemoteMachine');
            } else if (this.playbookSource == 'ansibleMachine') {
                this.playbookPath = tl.getInputRequired('playbookPathAnsibleMachineOnRemoteMachine');
            }

            this.inventoryType = tl.getInputRequired('inventoriesRemoteMachine');

            if (this.inventoryType == "file") {
                this.inventoryFileSource = tl.getInputRequired('inventoryFileSourceRemoteMachine');

                if (this.inventoryFileSource == 'agentMachine') {
                    this.inventoryFilePath = tl.getInputRequired('inventoryFileLinkedArtifactOnRemoteMachine');
                } else if (this.inventoryFileSource == 'ansibleMachine') {
                    this.inventoryFilePath = tl.getInputRequired('inventoryFileAnsibleMachineOnRemoteMachine');
                }
            } else if (this.inventoryType == 'hostList') {
                this.inventoryHostList = tl.getInputRequired('inventoryHostListRemoteMachine');
            } else if (this.inventoryType == 'inlineContent') {
                this.inventoryDynamic = tl.getBoolInput('inventoryInlineDynamicRemoteMachine', false);
                this.inventoryInline = tl.getInputRequired('inventoryInlineContentRemoteMachine');
            }
        } else if (this.ansibleInterface == 'agentMachine') {
            this.playbookPath = tl.getInputRequired('playbookPathOnAgentMachine');

            this.inventoryType = tl.getInputRequired('inventoriesAgentMachine');

            if (this.inventoryType == "file") {
                this.inventoryFilePath = tl.getInputRequired('inventoryFileOnAgentMachine');
            } else if (this.inventoryType == 'hostList') {
                this.inventoryHostList = tl.getInputRequired('inventoryHostListAgentMachine');
            } else if (this.inventoryType == 'inlineContent') {
                this.inventoryDynamic = tl.getBoolInput('inventoryInlineDynamicAgentMachine', false);
                this.inventoryInline = tl.getInputRequired('inventoryInlineContentAgentMachine');
            }
        }

        this.sudoEnable = tl.getBoolInput('sudoEnabled', false);

        if (this.sudoEnable) {
            this.sudoUser = tl.getInput('sudoUser', false);
        }

        this.additionalParams = tl.getInput('args', false);
        this.failOnStdErr = tl.getBoolInput('failOnStdErr', false);
    }

    public ansibleInterface = "agentMachine";
    public sshEndpoint = "";
    public playbookSource = "agentMachine";
    public playbookRoot = "";
    public playbookPath = "";
    public inventoryType = "noInventory";
    public inventoryFileSource = "agentMachine";
    public inventoryFilePath = "";
    public inventoryHostList = "";
    public inventoryDynamic = false;
    public inventoryInline = "";
    public sudoEnable = false;
    public sudoUser: string | undefined;
    public additionalParams: string | undefined;
    public failOnStdErr = true;

    private static _taskParameters: ansibleTaskParameters | null = null;
}