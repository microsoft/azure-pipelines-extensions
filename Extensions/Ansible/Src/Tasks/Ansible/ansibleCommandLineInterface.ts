import tl = require("azure-pipelines-task-lib/task");
import { quote } from 'shell-quote';

import { ansibleInterface } from './ansibleInterface';
import * as ansibleUtils from './ansibleUtils';
import { ansibleTaskParameters } from './ansibleTaskParameters';
import { shellQuote, neutralizeCommandSubstitution, shellSplit } from './shellEscaping';

export class ansibleCommandLineInterface extends ansibleInterface {
    constructor(params: ansibleTaskParameters) {
        super();
        this._taskParameters = params;
        this._remoteCmdOptions = new ansibleUtils.RemoteCommandOptions();
        this._additionalParams = "";
        this._cleanupCmd = [];
        this._playbookPath = "";
        this._inventoryPath = "";
        this._sudoUser = "";
        this._sanitizeActivate = false;
        this._sanitizeAudit = false;
        this._sanitizeTelemetry = false;
        this._sanitizedFields = [];
    }

    public async execute() {
        try {
            await this.setupConnection();
            const failOnStdErr = this._taskParameters.failOnStdErr;
            this._remoteCmdOptions.failOnStdErr = failOnStdErr;

            await this._executeAnsiblePlaybook();
        } catch (error) {
            tl.setResult(tl.TaskResult.Failed, error);
        } finally {
            //clean up script file if needed
            if (this._cleanupCmd && this._cleanupCmd.length > 0) {
                try {
                    for (let i = 0; i < this._cleanupCmd.length; i++) {
                        await this.executeCommand(this._cleanupCmd[i]!);
                    }
                } catch (err) {
                    tl.warning(tl.loc('RemoteFileCleanUpFailed', err));
                }
            }
            this.terminateConnection();
        }
    }

    protected async _executeAnsiblePlaybook() {
        // Feature flags gate the OS command-injection hardening (CWE-78) so it
        // can be rolled out safely. Consumed via tl.getBoolFeatureFlag, matching
        // the SshV0 / AzureCLI args-sanitizer rollout in azure-pipelines-tasks.
        //   AZP_75787_ENABLE_NEW_LOGIC     -> apply hardening (quote/neutralize)
        //   AZP_75787_ENABLE_NEW_LOGIC_LOG -> audit only (warn, keep legacy cmd)
        //   AZP_75787_ENABLE_COLLECT       -> emit telemetry only
        this._sanitizeActivate = tl.getBoolFeatureFlag('AZP_75787_ENABLE_NEW_LOGIC');
        this._sanitizeAudit = tl.getBoolFeatureFlag('AZP_75787_ENABLE_NEW_LOGIC_LOG');
        this._sanitizeTelemetry = tl.getBoolFeatureFlag('AZP_75787_ENABLE_COLLECT');
        this._sanitizedFields = [];

        if (this._playbookPath == null || this._playbookPath.trim() == "") {
            this._playbookPath = this._taskParameters.playbookPath;
        }

        tl.debug('PlaybookPath = ' + '"' + this._playbookPath + '"');

        if (this._inventoryPath == null || this._inventoryPath.trim() == "") {
            const inventoryLocation = this._taskParameters.inventoryType;

            if (inventoryLocation == 'file') {
                let inventoryFilePath = this._taskParameters.inventoryFilePath;
                this._inventoryPath = this._applyHardening('inventoryFile', inventoryFilePath, inventoryFilePath, shellQuote(inventoryFilePath));
            } else if (inventoryLocation == 'hostList') {
                this._inventoryPath = await this.getInventoryPathForHostList();
            } else if (inventoryLocation == 'inlineContent') {
                this._inventoryPath = await this.createAndGetInventoryPathForInline();
            }
        }

        tl.debug('InventoryFile = ' + this._inventoryPath);
        this._sudoUser = await this.getSudoUser();
        this._additionalParams = await this.getAdditionalParam();

        const playbookExecCmd = this._buildPlaybookExecutionCommand();
        tl.debug('Running ' + playbookExecCmd);

        await this.executeCommand(playbookExecCmd);
    }

    protected async setupConnection() {
        if (ansibleUtils.getAgentPlatform() === 'win32') {
            throw tl.loc('AgentOnWindowsMachine');
        }

        if (!ansibleUtils.getShellWhich('ansible')) {
            throw tl.loc('AnisbleNotPresent');
        }
    }

    protected terminateConnection() { }

    protected async executeCommand(cmd: string): Promise<string> {
        return await ansibleUtils.runCommandOnSameMachine(cmd, this._remoteCmdOptions);
    }

    protected async getSudoUser(): Promise<string> {
        const sudoEnabled = this._taskParameters.sudoEnable;
        let sudoUser = this._taskParameters.sudoUser;

        return new Promise<string>((resolve) => {
            if (sudoEnabled == true) {
                if (!sudoUser || sudoUser.trim() == "") {
                    sudoUser = 'root';
                }

                tl.debug('Sudo User = ' + sudoUser);
                resolve(sudoUser);
            } else {
                resolve("");
            }
        });
    }

    protected async getAdditionalParam(): Promise<string> {
        const args = this._taskParameters.additionalParams;

        return new Promise<string>((resolve) => {
            if (args && args.trim()) {
                resolve(args.trim());
            } else {
                resolve("");
            }
        })
    }

    protected async getInventoryPathForHostList(): Promise<string> {
        let hostList = this._taskParameters.inventoryHostList.trim();

        return new Promise<string>((resolve, reject) => {
            //host list should end with comma (,)
            if (!hostList.endsWith(','))
                hostList = hostList.concat(',');
            tl.debug("Host List = " + '"' + hostList + '"');
            resolve(this._applyHardening('inventoryHostList', hostList, '"' + hostList + '"', shellQuote(hostList)));
        });
    }

    protected async createAndGetInventoryPathForInline(): Promise<string> {
        const content = this._taskParameters.inventoryInline.trim();
        const dynamicInventory = this._taskParameters.inventoryDynamic;
        const __this = this;

        return new Promise<string>(async (resolve, reject) => {
            try {
                const remoteInventory = ansibleUtils.getTemporaryInventoryFilePath();
                const remoteInventoryPath = '"' + remoteInventory + '"';
                tl.debug('RemoteInventoryPath = ' + remoteInventoryPath);

                // Inline inventory content is user-controlled and echoed into a
                // file through the shell. It is always hardened via shell-quote
                // (CodeQL SM03609 / Bug 2236220), independent of the feature flag.
                const inventoryCmd = 'echo ' + quote([content]) + ' > ' + remoteInventory;
                await __this.executeCommand(inventoryCmd);

                if (dynamicInventory == true) {
                    await __this.executeCommand('chmod +x ' + remoteInventory);
                }

                this._cleanupCmd.push('rm -f ' + remoteInventory);
                resolve(remoteInventory);
            } catch (error) {
                reject(error);
            }
        });
    }

    private _buildPlaybookExecutionCommand() {
        let cmd = 'ansible-playbook ';

        if (this._inventoryPath && this._inventoryPath.trim()) {
            // Inventory value is already hardened where it is produced.
            cmd = cmd.concat('-i ' + this._inventoryPath + ' ');
        }

        if (this._playbookPath && this._playbookPath.trim()) {
            let playbookPath = this._applyHardening('playbookPath', this._playbookPath, this._playbookPath, shellQuote(this._playbookPath));
            cmd = cmd.concat(playbookPath + " ");
        }

        if (this._sudoUser && this._sudoUser.trim()) {
            let sudoUser = this._applyHardening('sudoUser', this._sudoUser, this._sudoUser, shellQuote(this._sudoUser));
            cmd = cmd.concat('-b --become-user ' + sudoUser + ' ');
        }

        if (this._additionalParams && this._additionalParams.trim()) {
            let hardenedParams = shellSplit(this._additionalParams).map(neutralizeCommandSubstitution).join(' ');
            let additionalParams = this._applyHardening('additionalParameters', this._additionalParams, this._additionalParams, hardenedParams);
            cmd = cmd.concat(additionalParams);
        }
        this._emitSanitizationSignals();
        return cmd;
    }

    // Returns the hardened value when the fix is activated, otherwise the legacy
    // value. Records fields that contain shell metacharacters so that the audit
    // and telemetry flags can report the injection surface during rollout.
    private _applyHardening(fieldName: string, rawValue: string, legacyValue: string, hardenedValue: string): string {
        if (rawValue && ansibleCommandLineInterface._shellMetaRegex.test(rawValue)
            && (this._sanitizeActivate || this._sanitizeAudit || this._sanitizeTelemetry)) {
            if (this._sanitizedFields.indexOf(fieldName) === -1) {
                this._sanitizedFields.push(fieldName);
            }
        }
        return this._sanitizeActivate ? hardenedValue : legacyValue;
    }

    private _emitSanitizationSignals() {
        if (!this._sanitizedFields || this._sanitizedFields.length === 0) {
            return;
        }
        if (this._sanitizeTelemetry) {
            let payload = {
                task: 'Ansible',
                activated: this._sanitizeActivate,
                sanitizedFields: this._sanitizedFields
            };
            console.log('##vso[telemetry.publish area=TaskHub;feature=Ansible]' + JSON.stringify(payload));
        }
        if (this._sanitizeAudit && !this._sanitizeActivate) {
            tl.warning(tl.loc('CommandArgumentsSanitized', this._sanitizedFields.join(', ')));
        }
    }

    protected _taskParameters: ansibleTaskParameters;
    protected _cleanupCmd: string[] = [];
    protected _remoteCmdOptions: ansibleUtils.RemoteCommandOptions;
    protected _playbookPath: string;
    protected _inventoryPath: string;
    private _sudoUser: string;
    private _additionalParams: string;
    private _sanitizeActivate: boolean;
    private _sanitizeAudit: boolean;
    private _sanitizeTelemetry: boolean;
    private _sanitizedFields: string[];
    // Shell command-control metacharacters that indicate an injection surface.
    private static _shellMetaRegex: RegExp = /[`$;|&<>()#\r\n'"\\]/;
}